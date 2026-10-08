import pytest
from sqlalchemy import select

from app.models import Expense, ExpenseSplit, SupportReport
from app.schemas.common import PaginationParams
from app.schemas.poll import PollVoteRequest
from app.schemas.support import (
    PublicSupportReportCreate,
    SupportReportCreate,
    SupportReportUpdate,
)
from app.services import poll_service
from app.services import support_service as service


@pytest.mark.parametrize("actor", ["support", "admin", "superadmin"])
def test_staff_can_diagnose_without_private_membership(
    db,
    scenario,
    pagination,
    actor,
    destination,
):
    result = service.user_trips(
        db,
        actor_id=getattr(scenario, actor).id,
        user_id=scenario.member.id,
        pagination=pagination,
    )
    assert result.items[0].id == scenario.trip.id

    for section in (
        "participants",
        "destinations",
        "activities",
        "expenses",
        "splits",
        "polls",
        "options",
        "reservations",
    ):
        page = service.diagnostic(
            db,
            actor_id=getattr(scenario, actor).id,
            trip_id=scenario.trip.id,
            section=section,
            pagination=pagination,
        )
        assert page.total >= 0



def test_diagnostic_is_read_only(db, scenario, pagination):
    from datetime import date

    expense = Expense(
        trip_id=scenario.trip.id,
        paid_by_user_id=scenario.owner.id,
        category_id=scenario.category.id,
        title="Hotel",
        amount=400000,
        expense_date=date.today(),
    )
    db.add(expense)
    db.flush()
    db.add(
        ExpenseSplit(
            expense_id=expense.id,
            user_id=scenario.member.id,
            amount=400000,
        )
    )
    db.commit()

    before = expense.paid_by_user_id
    result = service.diagnostic(
        db,
        actor_id=scenario.support.id,
        trip_id=scenario.trip.id,
        section="expenses",
        pagination=pagination,
    )

    assert scenario.owner.full_name in result.items[0].detail
    assert db.get(Expense, expense.id).paid_by_user_id == before



def test_support_results_count_votes(db, scenario, poll, pagination):
    poll_service.set_votes(
        db,
        actor_id=scenario.member.id,
        trip_id=scenario.trip.id,
        poll_id=poll.id,
        data=PollVoteRequest(
            option_ids=[poll.options[0].id, poll.options[1].id]
        ),
    )

    result = service.diagnostic(
        db,
        actor_id=scenario.support.id,
        trip_id=scenario.trip.id,
        section="options",
        pagination=pagination,
    )

    assert sum("1 votos" in row.detail for row in result.items) == 2



def test_user_creates_report_and_support_resolves_it(db, scenario):
    report = service.create_report(
        db,
        actor_id=scenario.member.id,
        data=SupportReportCreate(
            trip_id=scenario.trip.id,
            category="EXPENSE",
            subject="Pagador incorrecto",
            description="El gasto muestra un pagador diferente.",
        ),
    )

    assigned = service.assign_self(
        db,
        actor_id=scenario.support.id,
        report_id=report.id,
    )
    assert assigned.assigned_to_user_id == scenario.support.id
    assert assigned.status == "IN_REVIEW"

    resolved = service.update_report(
        db,
        actor_id=scenario.support.id,
        report_id=report.id,
        data=SupportReportUpdate(
            response="Se revisó la información del gasto.",
            status="RESOLVED",
        ),
    )
    assert resolved.status == "RESOLVED"
    assert resolved.resolved_at is not None



def test_support_can_escalate_but_not_modify_user_or_trip(db, scenario):
    report = service.create_report(
        db,
        actor_id=scenario.member.id,
        data=SupportReportCreate(
            trip_id=scenario.trip.id,
            category="ACCOUNT",
            subject="Requiere administración",
            description="Caso que necesita revisión administrativa.",
        ),
    )
    service.assign_self(
        db,
        actor_id=scenario.support.id,
        report_id=report.id,
    )
    escalated = service.escalate_report(
        db,
        reason="La cuenta requiere revisión de administración.",
        actor_id=scenario.support.id,
        report_id=report.id,
    )
    assert escalated.status == "ESCALATED"
    assert db.get(SupportReport, report.id).trip_id == scenario.trip.id



def test_public_report_does_not_require_user(db):
    report = service.create_public_report(
        db,
        data=PublicSupportReportCreate(
            contact_email="help@example.com",
            category="ACCESS",
            subject="No puedo iniciar sesión",
            description="La aplicación no me permite acceder.",
        ),
    )
    assert report.reported_by_user_id is None
    assert report.status == "OPEN"



def test_regular_user_cannot_use_staff_diagnostics(
    db,
    scenario,
    pagination,
    expect_error,
):
    with expect_error(403):
        service.diagnostic(
            db,
            actor_id=scenario.member.id,
            trip_id=scenario.trip.id,
            section="expenses",
            pagination=pagination,
        )



def test_support_endpoints_protect_access(client, login_headers, scenario):
    path = f"/api/support/trips/{scenario.trip.id}/diagnostic/participants"
    assert client.get(path).status_code == 401
    assert client.get(path, headers=login_headers(scenario.member)).status_code == 403
    assert client.get(path, headers=login_headers(scenario.support)).status_code == 200



def test_report_api_flow(client, login_headers, scenario):
    create = client.post(
        "/api/support-reports",
        headers=login_headers(scenario.member),
        json={
            "trip_id": scenario.trip.id,
            "category": "TRIP",
            "subject": "Problema del viaje",
            "description": "Necesito ayuda para revisar información del viaje.",
        },
    )
    assert create.status_code == 201
    report_id = create.json()["id"]

    support_headers = login_headers(scenario.support)
    assert client.get("/api/support/reports", headers=support_headers).status_code == 200
    assigned = client.post(
        f"/api/support/reports/{report_id}/assign-self",
        headers=support_headers,
    )
    assert assigned.status_code == 200

    resolved = client.patch(
        f"/api/support/reports/{report_id}",
        headers=support_headers,
        json={"status": "RESOLVED", "response": "Caso revisado."},
    )
    assert resolved.status_code == 200
    assert resolved.json()["status"] == "RESOLVED"
