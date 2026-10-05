from sqlalchemy import func, select

from app.models import AuditLog
from app.services import audit_service as service


def test_audit_joins_callers_transaction(db, scenario):
    service.record_action(
        db,
        user_id=scenario.owner.id,
        action="TEST_ROLLBACK",
    )

    db.flush()
    db.rollback()

    assert db.scalar(
        select(func.count()).select_from(AuditLog)
    ) == 0


def test_audit_access_and_filters(
    db,
    scenario,
    pagination,
    expect_error,
):
    service.record_action(
        db,
        user_id=scenario.owner.id,
        action="TEST_ACTION",
        entity="app.trips",
        entity_id=scenario.trip.id,
    )

    db.commit()

    with expect_error(403):
        service.list_audit_logs(
            db,
            actor_id=scenario.admin.id,
            pagination=pagination,
        )

    result = service.list_audit_logs(
        db,
        actor_id=scenario.superadmin.id,
        pagination=pagination,
        action="TEST_ACTION",
        entity_id=scenario.trip.id,
    )

    assert result.total == 1
    assert result.items[0].user_id == scenario.owner.id


def test_audit_returns_name_role_and_filters_by_name(db, scenario, pagination):
    service.record_action(db, user_id=scenario.owner.id, action='NAME_TEST')
    db.commit()
    result = service.list_audit_logs(db, actor_id=scenario.superadmin.id, pagination=pagination,
                                     action='NAME_TEST', q=scenario.owner.username)
    assert result.total == 1
    assert result.items[0].actor_name == scenario.owner.full_name
    assert result.items[0].actor_role == 'USER'
