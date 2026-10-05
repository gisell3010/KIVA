import pytest
from sqlalchemy import select, func
from app.models import AuditLog, Expense, ExpenseSplit
from app.services import support_service as service, auth_service, poll_service
from app.schemas.auth import LoginRequest
from app.schemas.common import PaginationParams
from app.schemas.poll import PollVoteRequest

@pytest.mark.parametrize('actor', ['support','admin','superadmin'])
def test_staff_can_diagnose_without_private_membership(db, scenario, pagination, actor, destination):
    result = service.user_trips(db, actor_id=getattr(scenario,actor).id, user_id=scenario.member.id, pagination=pagination)
    assert result.items[0].id == scenario.trip.id
    for section in ('participants','destinations','activities','expenses','splits','polls','options','reservations'):
        page = service.diagnostic(db, actor_id=getattr(scenario,actor).id, trip_id=scenario.trip.id, section=section, pagination=pagination)
        assert page.total >= 0
    page = service.diagnostic(db, actor_id=getattr(scenario,actor).id, trip_id=scenario.trip.id, section='destinations', pagination=pagination)
    assert 'Madrid' in page.items[0].title


def test_diagnostic_does_not_change_payer_and_names_splits(db, scenario, pagination):
    from datetime import date
    item = Expense(trip_id=scenario.trip.id, paid_by_user_id=scenario.owner.id, category_id=scenario.category.id,
                   title='Hotel', amount=400000, expense_date=date.today())
    db.add(item); db.flush()
    db.add(ExpenseSplit(expense_id=item.id, user_id=scenario.member.id, amount=400000)); db.commit()
    before = item.paid_by_user_id
    result = service.diagnostic(db, actor_id=scenario.support.id, trip_id=scenario.trip.id, section='expenses', pagination=pagination)
    assert scenario.owner.full_name in result.items[0].detail
    assert '400000' in result.items[0].detail
    splits = service.diagnostic(db, actor_id=scenario.support.id, trip_id=scenario.trip.id, section='splits', pagination=pagination)
    assert splits.items[0].title == 'Hotel'
    assert db.get(Expense,item.id).paid_by_user_id == before


def test_support_results_count_votes(db, scenario, poll, pagination):
    poll_service.set_votes(db, actor_id=scenario.member.id, trip_id=scenario.trip.id, poll_id=poll.id,
                          data=PollVoteRequest(option_ids=[poll.options[0].id,poll.options[1].id]))
    result = service.diagnostic(db, actor_id=scenario.support.id, trip_id=scenario.trip.id, section='options', pagination=pagination)
    assert sum('1 votos' in row.detail for row in result.items) == 2


def test_support_revocation_is_audited_and_invalidates_access(db, scenario, password, expect_error):
    result = auth_service.login(db, LoginRequest(email=scenario.member.email, password=password))
    service.revoke_sessions(db, actor_id=scenario.support.id, user_id=scenario.member.id)
    with expect_error(401):
        auth_service.refresh(db, result.refresh_token)
    assert db.scalar(select(func.count()).select_from(AuditLog).where(AuditLog.action=='SUPPORT_SESSIONS_REVOKE')) == 1
    with expect_error(403):
        service.revoke_sessions(db, actor_id=scenario.support.id, user_id=scenario.admin.id)


def test_regular_user_cannot_diagnose_or_revoke(db, scenario, pagination, expect_error):
    with expect_error(403):
        service.diagnostic(db, actor_id=scenario.member.id, trip_id=scenario.trip.id, section='expenses', pagination=pagination)
    with expect_error(403):
        service.revoke_sessions(db, actor_id=scenario.member.id, user_id=scenario.owner.id)


def test_diagnostic_endpoints_protect_access(client, login_headers, scenario):
    path = f'/api/support/trips/{scenario.trip.id}/diagnostic/participants'
    assert client.get(path).status_code == 401
    assert client.get(path, headers=login_headers(scenario.member)).status_code == 403
    assert client.get(path, headers=login_headers(scenario.support)).status_code == 200
