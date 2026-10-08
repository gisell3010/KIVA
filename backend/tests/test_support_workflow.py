import pytest
from sqlalchemy import select
from app.models import Notification, SupportMessage, SupportReport
from app.schemas.support import SupportReportCreate, SupportReportUpdate, SupportMessageCreate, PublicSupportReportCreate, PublicSupportAccess, PublicSupportReply
from app.services import support_service as service


@pytest.fixture
def report(db, scenario):
    return service.create_report(db, actor_id=scenario.member.id, data=SupportReportCreate(
        category="ACCOUNT", subject="Necesito ayuda", description="No encuentro una opción de mi cuenta."))


def take(db, scenario, report):
    return service.assign_self(db, actor_id=scenario.support.id, report_id=report.id)


def test_report_lists_serialize_populated_orm_rows(db, scenario, report, pagination):
    mine = service.list_my_reports(db, actor_id=scenario.member.id, pagination=pagination)
    staff = service.list_reports(db, actor_id=scenario.support.id, pagination=pagination, q="ayuda")
    assert mine.total == staff.total == 1
    assert mine.items[0].id == staff.items[0].id == report.id


def test_creation_notifies_reporter_and_support_with_deep_links(db, scenario, report):
    notifications = db.scalars(select(Notification).where(Notification.action_path.like(f"%reporte={report.id}"))).all()
    assert {n.user_id for n in notifications} == {scenario.member.id, scenario.support.id}
    assert any(n.action_path == f"/reportes?reporte={report.id}" for n in notifications)


def test_escalation_releases_support_and_requires_admin(db, scenario, report, expect_error):
    take(db, scenario, report)
    result = service.escalate_report(db, actor_id=scenario.support.id, report_id=report.id, reason="Requiere revisar el estado de la cuenta.")
    assert result.assigned_to_user_id is None
    with expect_error(403, "REPORT_ESCALATED"):
        service.assign_self(db, actor_id=scenario.support.id, report_id=report.id)
    with expect_error(403, "REPORT_ESCALATED"):
        service.update_report(db, actor_id=scenario.support.id, report_id=report.id, data=SupportReportUpdate(status="RESOLVED", response="Resuelto"))
    service.assign_self(db, actor_id=scenario.admin.id, report_id=report.id)
    result = service.update_report(db, actor_id=scenario.admin.id, report_id=report.id, data=SupportReportUpdate(status="RESOLVED", response="La cuenta fue revisada y la incidencia está resuelta."))
    assert result.status == "RESOLVED"


def test_history_and_internal_notes_are_private(db, scenario, report, pagination):
    take(db, scenario, report)
    service.add_message(db, actor_id=scenario.support.id, report_id=report.id, staff=True, data=SupportMessageCreate(body="Detalle interno de diagnóstico", is_internal=True))
    service.add_message(db, actor_id=scenario.support.id, report_id=report.id, staff=True, data=SupportMessageCreate(body="Primera respuesta"))
    service.add_message(db, actor_id=scenario.support.id, report_id=report.id, staff=True, data=SupportMessageCreate(body="Segunda respuesta"))
    public = service.list_messages(db, actor_id=scenario.member.id, report_id=report.id, pagination=pagination)
    staff = service.list_messages(db, actor_id=scenario.support.id, report_id=report.id, pagination=pagination, staff=True)
    assert len(staff.items) == len(public.items) + 1
    assert all(not m.is_internal for m in public.items)
    assert {"Primera respuesta", "Segunda respuesta"} <= {m.body for m in public.items}


def test_reporter_cannot_read_someone_elses_case(db, scenario, report, pagination, expect_error):
    with expect_error(404):
        service.list_messages(db, actor_id=scenario.outsider.id, report_id=report.id, pagination=pagination)
    with expect_error(403):
        service.add_message(db, actor_id=scenario.member.id, report_id=report.id, data=SupportMessageCreate(body="Nota", is_internal=True))


def test_resolution_requires_explanation_and_close_keeps_resolution_date(db, scenario, report, expect_error):
    take(db, scenario, report)
    with expect_error(422, "RESPONSE_REQUIRED"):
        service.update_report(db, actor_id=scenario.support.id, report_id=report.id, data=SupportReportUpdate(status="RESOLVED"))
    resolved = service.update_report(db, actor_id=scenario.support.id, report_id=report.id, data=SupportReportUpdate(status="RESOLVED", response="Se explicó el permiso de propietario."))
    closed = service.update_report(db, actor_id=scenario.support.id, report_id=report.id, data=SupportReportUpdate(status="CLOSED"))
    assert closed.resolved_at == resolved.resolved_at
    with expect_error(409, "REPORT_FINISHED"):
        service.add_message(db, actor_id=scenario.member.id, report_id=report.id, data=SupportMessageCreate(body="Otro mensaje"))


def test_reporter_reopens_resolved_case(db, scenario, report):
    take(db, scenario, report)
    service.update_report(db, actor_id=scenario.support.id, report_id=report.id, data=SupportReportUpdate(status="RESOLVED", response="Prueba de nuevo."))
    service.add_message(db, actor_id=scenario.member.id, report_id=report.id, data=SupportMessageCreate(body="El problema continúa."))
    saved = db.get(SupportReport, report.id)
    assert saved.status == "IN_REVIEW" and saved.resolved_at is None


def test_public_receipt_stores_only_hash_and_allows_private_followup(db, scenario, pagination, expect_error):
    receipt = service.create_public_report(db, data=PublicSupportReportCreate(contact_email="public@example.com", category="ACCESS", subject="Acceso", description="No puedo acceder."))
    stored = db.get(SupportReport, receipt.id)
    assert stored.tracking_token_hash != receipt.tracking_token
    access = PublicSupportAccess(report_id=receipt.id, tracking_token=receipt.tracking_token)
    assert service.public_report(db, data=access).id == receipt.id
    take(db, scenario, receipt)
    service.add_message(db, actor_id=scenario.support.id, report_id=receipt.id, staff=True, data=SupportMessageCreate(body="Se revisa con administración", is_internal=True))
    service.public_reply(db, data=PublicSupportReply(**access.model_dump(), body="Adjunto más detalles del problema."))
    assert all(not m.is_internal for m in service.public_messages(db, data=access, pagination=pagination).items)
    with expect_error(404):
        service.public_report(db, data=PublicSupportAccess(report_id=receipt.id, tracking_token="x"*43))


def test_assignment_conflicts_and_admin_reassigns(db, scenario, report, expect_error):
    take(db, scenario, report)
    with expect_error(409, "REPORT_ASSIGNED"):
        service.assign_self(db, actor_id=scenario.admin.id, report_id=report.id)
    with expect_error(403):
        service.assign_report(db, actor_id=scenario.support.id, report_id=report.id, user_id=scenario.admin.id)
    result = service.assign_report(db, actor_id=scenario.admin.id, report_id=report.id, user_id=scenario.admin.id)
    assert result.assigned_to_user_id == scenario.admin.id


def test_limit_submissions_per_contact(db, scenario, expect_error):
    data = SupportReportCreate(category="OTHER", subject="Solicitud", description="Revisar el caso.")
    for _ in range(5): service.create_report(db, actor_id=scenario.member.id, data=data)
    with expect_error(429): service.create_report(db, actor_id=scenario.member.id, data=data)


def test_api_rejects_escalation_without_reason(client, login_headers, scenario, report):
    headers = login_headers(scenario.support)
    assert client.post(f"/api/support/reports/{report.id}/assign-self", headers=headers).status_code == 200
    assert client.post(f"/api/support/reports/{report.id}/escalate", headers=headers, json={}).status_code == 422
    response = client.post(f"/api/support/reports/{report.id}/escalate", headers=headers, json={"reason":"Se requiere verificar la cuenta."})
    assert response.status_code == 200
    assert response.json()["assigned_to_user_id"] is None


def test_public_http_followup_and_note_privacy(client, login_headers, scenario):
    receipt = client.post("/api/support-reports/public", json={"contact_email":"followup@example.com", "category":"ACCESS", "subject":"Ayuda", "description":"No puedo acceder"})
    assert receipt.status_code == 201
    access = {"report_id": receipt.json()["id"], "tracking_token": receipt.json()["tracking_token"]}
    assert client.post("/api/support-reports/public/lookup", json=access).status_code == 200
    assert client.post("/api/support-reports/public/reply", json={**access, "body":"Más detalles"}).status_code == 201
    messages = client.post("/api/support-reports/public/messages", json=access)
    assert messages.status_code == 200
    assert messages.json()["items"][0]["body"] == "Más detalles"
    assert client.post("/api/support-reports/public/lookup", json={**access, "tracking_token":"x"*43}).status_code == 404
