import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Literal

from sqlalchemy import func, or_, select, text

from app.models.activity import Activity
from app.models.destination import Destination
from app.models.expense import Expense, ExpenseSplit
from app.models.group import GroupMember, TravelGroup
from app.models.poll import Poll, PollOption, Vote
from app.models.reservation import Reservation
from app.models.support_report import SupportReport, SupportMessage
from app.models.trip import Trip, TripMember
from app.models.user import User
from app.schemas.common import Page, Schema
from app.schemas.group import GroupRead
from app.schemas.support import (
    PublicSupportReportCreate, PublicSupportReceipt, SupportDashboardRead,
    SupportReportCreate, SupportReportDetail, SupportReporterRead,
    SupportReportRead, SupportReportUpdate, SupportTripRead, SupportMessageRead,
)
from app.schemas.trip import TripRead
from app.services import group_service, trip_service
from app.services._shared import active_user, allow, atomic, audit, fail, mapped_page, page, required
from app.services.notification_service import create_notification

DOMAIN_LABELS = {"PLANNING": "En planificación", "CONFIRMED": "Confirmado", "COMPLETED": "Finalizado", "CANCELLED": "Cancelado", "PENDING": "Pendiente", "APPROVED": "Aprobado", "REJECTED": "Rechazado", "OPEN": "Abierta", "CLOSED": "Cerrada"}

Section = Literal["participants", "destinations", "activities", "expenses", "splits", "polls", "options", "reservations"]
STAFF = {"SUPPORT", "ADMIN", "SUPER_ADMIN"}
ADMINS = {"ADMIN", "SUPER_ADMIN"}
STATUS_LABELS = {"OPEN": "abierto", "IN_REVIEW": "en revisión", "ESCALATED": "en revisión administrativa", "RESOLVED": "resuelto", "CLOSED": "cerrado"}
TRANSITIONS = {
    "OPEN": {"IN_REVIEW"},
    "IN_REVIEW": {"RESOLVED"},
    "ESCALATED": {"IN_REVIEW", "RESOLVED"},
    "RESOLVED": {"CLOSED", "IN_REVIEW"},
    "CLOSED": set(),
}


class DiagnosticRow(Schema):
    id: int
    title: str
    detail: str


def authorize(db, actor_id):
    actor = active_user(db, actor_id)
    allow(actor.role, STAFF)
    return actor


def _report_detail(db, report):
    reporter = db.get(User, report.reported_by_user_id) if report.reported_by_user_id else None
    assignee = db.get(User, report.assigned_to_user_id) if report.assigned_to_user_id else None
    trip = db.get(Trip, report.trip_id) if report.trip_id else None
    return SupportReportDetail(
        **SupportReportRead.model_validate(report).model_dump(),
        reporter=SupportReporterRead.model_validate(reporter) if reporter else None,
        assignee=SupportReporterRead.model_validate(assignee) if assignee else None,
        trip=SupportTripRead.model_validate(trip) if trip else None,
    )


def _get_report(db, report_id, *, lock=False):
    statement = select(SupportReport).where(SupportReport.id == report_id)
    return required(db, statement.with_for_update() if lock else statement)


def _notify_reporter(db, report, message):
    if report.reported_by_user_id:
        create_notification(db, user_id=report.reported_by_user_id,
            title=f"Reporte #{report.id}", message=message,
            action_path=f"/reportes?reporte={report.id}")


def _notify_team(db, report, *, admins=False, exclude=None):
    roles = ADMINS if admins else {"SUPPORT"}
    ids = db.scalars(select(User.id).where(User.status == "ACTIVE", User.role.in_(roles))).all()
    if not ids and not admins:
        ids = db.scalars(select(User.id).where(User.status == "ACTIVE", User.role.in_(ADMINS))).all()
    for user_id in ids:
        if user_id != exclude:
            create_notification(db, user_id=user_id,
                title="Reporte escalado" if admins else "Nuevo reporte de soporte",
                message=f"#{report.id} · {report.subject}",
                action_path=f"/soporte/reportes?reporte={report.id}")


def _message(db, report, actor, body, *, internal=False):
    item = SupportMessage(report_id=report.id, author_id=actor.id if actor else None,
        author_label=(actor.full_name if actor else "Solicitante"), body=body, is_internal=internal)
    db.add(item)
    report.updated_at = datetime.now(timezone.utc)
    db.flush()
    return SupportMessageRead.model_validate(item)


def _can_manage(actor, report):
    if actor.role == "SUPPORT" and report.status == "ESCALATED":
        fail("Este reporte está a cargo de administración.", "REPORT_ESCALATED", 403)
    if report.assigned_to_user_id != actor.id:
        fail("Asígnate el reporte antes de atenderlo.", "REPORT_NOT_ASSIGNED", 403)


def _rate_limit(db, email):
    # Serializa el límite por correo entre procesos y réplicas.
    db.execute(text("SELECT pg_advisory_xact_lock(hashtext(:email))"), {"email": email})
    count = db.scalar(select(func.count()).select_from(SupportReport).where(
        SupportReport.contact_email == email,
        SupportReport.created_at >= datetime.now(timezone.utc) - timedelta(hours=1))) or 0
    if count >= 5:
        fail("Ya recibimos varias solicitudes. Espera una hora antes de enviar otra.", "REPORT_RATE_LIMIT", 429)


@atomic
def create_report(db, *, actor_id, data: SupportReportCreate):
    actor = active_user(db, actor_id)
    _rate_limit(db, actor.email)
    if data.trip_id is not None:
        required(db, select(TripMember).where(TripMember.trip_id == data.trip_id, TripMember.user_id == actor.id))
    report = SupportReport(reported_by_user_id=actor.id, contact_email=actor.email, **data.model_dump(), status="OPEN")
    db.add(report)
    db.flush()
    audit(db, actor.id, "SUPPORT_REPORT_CREATED", report)
    _notify_team(db, report, exclude=actor.id)
    _notify_reporter(db, report, "Recibimos tu solicitud. Puedes seguir la conversación en Mis reportes.")
    return SupportReportRead.model_validate(report)


@atomic
def create_public_report(db, *, data: PublicSupportReportCreate):
    _rate_limit(db, data.contact_email)
    token = secrets.token_urlsafe(32)
    report = SupportReport(**data.model_dump(), status="OPEN",
        tracking_token_hash=hashlib.sha256(token.encode()).hexdigest())
    db.add(report)
    db.flush()
    _notify_team(db, report)
    return PublicSupportReceipt(**SupportReportRead.model_validate(report).model_dump(), tracking_token=token)


def _own_report(db, actor_id, report_id, *, lock=False):
    active_user(db, actor_id)
    statement = select(SupportReport).where(SupportReport.id == report_id, SupportReport.reported_by_user_id == actor_id)
    return required(db, statement.with_for_update() if lock else statement)


def _public_report(db, data, *, lock=False):
    digest = hashlib.sha256(data.tracking_token.get_secret_value().encode()).hexdigest()
    statement = select(SupportReport).where(SupportReport.id == data.report_id,
        SupportReport.reported_by_user_id.is_(None), SupportReport.tracking_token_hash == digest)
    return required(db, statement.with_for_update() if lock else statement)


def public_report(db, *, data):
    return SupportReportRead.model_validate(_public_report(db, data))


def list_my_reports(db, *, actor_id, pagination):
    active_user(db, actor_id)
    return page(db, select(SupportReport).where(SupportReport.reported_by_user_id == actor_id)
        .order_by(SupportReport.created_at.desc(), SupportReport.id.desc()), pagination, SupportReportRead)


def get_my_report(db, *, actor_id, report_id):
    return SupportReportRead.model_validate(_own_report(db, actor_id, report_id))


def dashboard(db, *, actor_id):
    authorize(db, actor_id)
    counts = dict(db.execute(select(SupportReport.status, func.count(SupportReport.id)).group_by(SupportReport.status)).all())
    unassigned = db.scalar(select(func.count()).select_from(SupportReport).where(
        SupportReport.assigned_to_user_id.is_(None), SupportReport.status.in_(("OPEN", "IN_REVIEW", "ESCALATED")))) or 0
    return SupportDashboardRead(open_reports_count=counts.get("OPEN", 0), in_review_reports_count=counts.get("IN_REVIEW", 0),
        escalated_reports_count=counts.get("ESCALATED", 0), resolved_reports_count=counts.get("RESOLVED", 0), unassigned_reports_count=unassigned)


def list_reports(db, *, actor_id, pagination, q=None, status=None, category=None, assigned_to_me=False, unassigned=False):
    actor = authorize(db, actor_id)
    conditions = []
    if status: conditions.append(SupportReport.status == status)
    if category: conditions.append(SupportReport.category == category)
    if assigned_to_me: conditions.append(SupportReport.assigned_to_user_id == actor.id)
    if unassigned: conditions.append(SupportReport.assigned_to_user_id.is_(None))
    if q and q.strip():
        term = q.strip().lower()
        conditions.append(or_(func.lower(SupportReport.subject).contains(term, autoescape=True),
            func.lower(SupportReport.contact_email).contains(term, autoescape=True)))
    return page(db, select(SupportReport).where(*conditions)
        .order_by(SupportReport.created_at.desc(), SupportReport.id.desc()), pagination, SupportReportRead)


def get_report(db, *, actor_id, report_id):
    authorize(db, actor_id)
    return _report_detail(db, _get_report(db, report_id))


@atomic
def assign_self(db, *, actor_id, report_id):
    actor = authorize(db, actor_id)
    report = _get_report(db, report_id, lock=True)
    if report.status in {"RESOLVED", "CLOSED"}: fail("El reporte ya está finalizado.", "REPORT_FINISHED")
    if report.status == "ESCALATED" and actor.role not in ADMINS:
        fail("Administración atenderá este reporte.", "REPORT_ESCALATED", 403)
    if report.assigned_to_user_id == actor.id: return _report_detail(db, report)
    if report.assigned_to_user_id:
        previous = db.get(User, report.assigned_to_user_id)
        if previous and previous.status == "ACTIVE" and previous.role in STAFF:
            fail("El reporte ya está asignado a otra persona.", "REPORT_ASSIGNED")
    report.assigned_to_user_id = actor.id
    if report.status == "OPEN": report.status = "IN_REVIEW"
    _message(db, report, actor, "Tomó la atención del reporte.")
    audit(db, actor.id, "SUPPORT_REPORT_ASSIGNED", report)
    _notify_reporter(db, report, "Una persona del equipo está revisando tu solicitud.")
    return _report_detail(db, report)


@atomic
def assign_report(db, *, actor_id, report_id, user_id):
    actor = authorize(db, actor_id)
    allow(actor.role, ADMINS)
    report = _get_report(db, report_id, lock=True)
    if report.status in {"RESOLVED", "CLOSED"}: fail("El reporte ya está finalizado.", "REPORT_FINISHED")
    target = active_user(db, user_id)
    allow(target.role, ADMINS if report.status == "ESCALATED" else STAFF)
    if report.assigned_to_user_id == user_id: return _report_detail(db, report)
    previous = report.assigned_to_user_id
    report.assigned_to_user_id = user_id
    if report.status == "OPEN": report.status = "IN_REVIEW"
    _message(db, report, actor, f"Asignó el reporte a {target.full_name}.", internal=True)
    audit(db, actor.id, "SUPPORT_REPORT_REASSIGNED", report)
    for recipient in {user_id, previous} - {None, actor.id}:
        create_notification(db, user_id=recipient, title="Asignación de soporte actualizada",
            message=f"El reporte #{report.id} quedó asignado a {target.full_name}.",
            action_path=f"/soporte/reportes?reporte={report.id}")
    return _report_detail(db, report)


@atomic
def update_report(db, *, actor_id, report_id, data: SupportReportUpdate):
    actor = authorize(db, actor_id)
    report = _get_report(db, report_id, lock=True)
    _can_manage(actor, report)
    if report.status == "CLOSED": fail("El reporte está cerrado. Crea uno nuevo si necesitas ayuda.", "REPORT_FINISHED")
    old_status = report.status
    if data.status and data.status != old_status:
        if data.status not in TRANSITIONS[old_status]: fail("Ese cambio de estado no está disponible.", "INVALID_REPORT_STATUS")
        if data.status == "RESOLVED" and not data.response:
            fail("Explica la solución antes de resolver el reporte.", "RESPONSE_REQUIRED", 422)
    if data.response:
        report.response = data.response
        _message(db, report, actor, data.response)
    if data.status and data.status != old_status:
        report.status = data.status
        if data.status == "RESOLVED": report.resolved_at = datetime.now(timezone.utc)
        elif data.status != "CLOSED": report.resolved_at = None
        _message(db, report, actor, f"Estado actualizado: {STATUS_LABELS[report.status]}.")
    report.updated_at = datetime.now(timezone.utc)
    db.flush()
    audit(db, actor.id, "SUPPORT_REPORT_UPDATED", report)
    _notify_reporter(db, report, f"Hay novedades en tu solicitud. Estado: {STATUS_LABELS[report.status]}.")
    return _report_detail(db, report)


@atomic
def escalate_report(db, *, actor_id, report_id, reason):
    actor = authorize(db, actor_id)
    report = _get_report(db, report_id, lock=True)
    _can_manage(actor, report)
    if report.status != "IN_REVIEW": fail("Solo puedes escalar un reporte en revisión.", "INVALID_REPORT_STATUS")
    if not reason or len(reason.strip()) < 10: fail("Describe por qué necesitas apoyo de administración.", "REASON_REQUIRED", 422)
    report.status = "ESCALATED"
    report.assigned_to_user_id = None
    _message(db, report, actor, f"Motivo del escalamiento: {reason.strip()}", internal=True)
    _message(db, report, actor, "El caso se envió a administración para continuar la revisión.")
    audit(db, actor.id, "SUPPORT_REPORT_ESCALATED", report)
    _notify_team(db, report, admins=True, exclude=actor.id)
    _notify_reporter(db, report, "Tu solicitud necesita una revisión de administración. Te avisaremos cuando haya una respuesta.")
    return _report_detail(db, report)


def list_messages(db, *, actor_id, report_id, pagination, staff=False):
    if staff:
        authorize(db, actor_id)
        _get_report(db, report_id)
    else: _own_report(db, actor_id, report_id)
    return _messages(db, report_id, pagination, staff=staff)


def _messages(db, report_id, pagination, *, staff=False):
    statement = select(SupportMessage).where(SupportMessage.report_id == report_id)
    if not staff: statement = statement.where(SupportMessage.is_internal.is_(False))
    return page(db, statement.order_by(SupportMessage.id), pagination, SupportMessageRead)


def public_messages(db, *, data, pagination):
    report = _public_report(db, data)
    return _messages(db, report.id, pagination)


def _reply(db, report, actor, body):
    if report.status == "CLOSED": fail("El reporte está cerrado. Crea uno nuevo si necesitas ayuda.", "REPORT_FINISHED")
    if report.status == "RESOLVED":
        report.status = "IN_REVIEW"
        report.resolved_at = None
        _message(db, report, actor, "Solicitó continuar la revisión del reporte.")
    result = _message(db, report, actor, body)
    assignee = db.get(User, report.assigned_to_user_id) if report.assigned_to_user_id else None
    if assignee and assignee.status == "ACTIVE" and assignee.role in STAFF:
        create_notification(db, user_id=assignee.id, title="Nueva respuesta en soporte",
            message=f"El solicitante respondió al reporte #{report.id}.", action_path=f"/soporte/reportes?reporte={report.id}")
    else:
        report.assigned_to_user_id = None
        _notify_team(db, report, admins=report.status == "ESCALATED")
    audit(db, actor.id if actor else None, "SUPPORT_REPORT_REPLY", report)
    return result


@atomic
def add_message(db, *, actor_id, report_id, data, staff=False):
    if staff:
        actor = authorize(db, actor_id)
        report = _get_report(db, report_id, lock=True)
        _can_manage(actor, report)
        if report.status in {"CLOSED", "RESOLVED"}: fail("Reabre el reporte antes de continuar.", "REPORT_FINISHED")
        result = _message(db, report, actor, data.body, internal=data.is_internal)
        if not data.is_internal:
            report.response = data.body
            _notify_reporter(db, report, "El equipo respondió a tu solicitud. Abre el reporte para leer la respuesta.")
        audit(db, actor.id, "SUPPORT_REPORT_NOTE" if data.is_internal else "SUPPORT_REPORT_REPLY", report)
        return result
    if data.is_internal: fail("No puedes crear notas internas.", "FORBIDDEN", 403)
    report = _own_report(db, actor_id, report_id, lock=True)
    return _reply(db, report, active_user(db, actor_id), data.body)


@atomic
def public_reply(db, *, data):
    return _reply(db, _public_report(db, data, lock=True), None, data.body)


def list_agents(db, *, actor_id):
    authorize(db, actor_id)
    return [SupportReporterRead.model_validate(user) for user in db.scalars(
        select(User).where(User.status == "ACTIVE", User.role.in_(STAFF)).order_by(User.full_name)).all()]


def user_groups(db, *, actor_id, user_id, pagination):
    authorize(db, actor_id)
    required(db, select(User).where(User.id == user_id))
    ids = select(GroupMember.group_id).where(GroupMember.user_id == user_id)
    return mapped_page(
        db,
        group_service.group_query(user_id, all_trips=True)
        .where(TravelGroup.id.in_(ids))
        .order_by(TravelGroup.id),
        pagination,
        GroupRead,
    )


def user_trips(db, *, actor_id, user_id, pagination):
    authorize(db, actor_id)
    required(db, select(User).where(User.id == user_id))
    ids = select(TripMember.trip_id).where(TripMember.user_id == user_id)
    return mapped_page(
        db,
        trip_service.trip_query(user_id)
        .where(Trip.id.in_(ids))
        .order_by(Trip.id),
        pagination,
        TripRead,
    )


def trip_info(db, *, actor_id, trip_id):
    authorize(db, actor_id)
    trip = required(db, select(Trip).where(Trip.id == trip_id))
    return SupportTripRead.model_validate(trip)


def diagnostic(db, *, actor_id, trip_id, section, pagination):
    authorize(db, actor_id)
    required(db, select(Trip).where(Trip.id == trip_id))
    models = {
        "participants": TripMember,
        "destinations": Destination,
        "activities": Activity,
        "expenses": Expense,
        "splits": ExpenseSplit,
        "polls": Poll,
        "options": PollOption,
        "reservations": Reservation,
    }
    model = models[section]
    statement = select(model)

    if section == "splits":
        statement = statement.join(Expense).where(Expense.trip_id == trip_id)
    elif section == "options":
        statement = statement.join(Poll).where(Poll.trip_id == trip_id)
    else:
        statement = statement.where(model.trip_id == trip_id)

    total = db.scalar(
        select(func.count()).select_from(statement.subquery())
    ) or 0
    rows = db.scalars(
        statement.order_by(model.id)
        .offset((pagination.page - 1) * pagination.page_size)
        .limit(pagination.page_size)
    ).all()

    user_ids = set()
    for row in rows:
        for key in ("user_id", "paid_by_user_id", "proposed_by_user_id"):
            value = getattr(row, key, None)
            if value:
                user_ids.add(value)

    names = (
        dict(
            db.execute(
                select(User.id, User.full_name).where(User.id.in_(user_ids))
            ).all()
        )
        if user_ids
        else {}
    )

    votes = (
        dict(
            db.execute(
                select(Vote.option_id, func.count(Vote.id))
                .where(Vote.option_id.in_([row.id for row in rows]))
                .group_by(Vote.option_id)
            ).all()
        )
        if section == "options"
        else {}
    )

    expenses = (
        dict(
            db.execute(
                select(Expense.id, Expense.title).where(
                    Expense.id.in_([row.expense_id for row in rows])
                )
            ).all()
        )
        if section == "splits"
        else {}
    )

    polls = (
        dict(
            db.execute(
                select(Poll.id, Poll.question).where(
                    Poll.id.in_([row.poll_id for row in rows])
                )
            ).all()
        )
        if section == "options"
        else {}
    )

    items = []
    for row in rows:
        if section == "participants":
            title = names.get(row.user_id, "Usuario")
            detail = {
                "OWNER": "Responsable",
                "ORGANIZER": "Organizador",
                "MEMBER": "Participante",
            }[row.role]
        elif section == "destinations":
            title = f"{row.place_name}, {row.country}"
            detail = (
                f"Propuesto por {names.get(row.proposed_by_user_id, 'Usuario')} · "
                f"{'Seleccionado' if row.is_selected else 'Propuesta'} · "
                f"{row.description or ''}"
            )
        elif section == "activities":
            title = row.title
            detail = (
                f"{row.activity_date} · {row.start_time or ''} · {DOMAIN_LABELS.get(row.status, row.status)} · "
                f"{row.location or ''} · Costo: {row.estimated_cost}"
            )
        elif section == "expenses":
            title = row.title
            detail = (
                f"Pagador: {names.get(row.paid_by_user_id, 'Usuario')} · "
                f"Total: {row.amount} COP · {row.expense_date}"
            )
        elif section == "splits":
            title = expenses.get(row.expense_id, "Gasto")
            detail = f"{names.get(row.user_id, 'Usuario')} · Parte: {row.amount} COP"
        elif section == "polls":
            title = row.question
            detail = f"{DOMAIN_LABELS.get(row.status, row.status)} · Cierre: {row.closes_at or 'Sin fecha'}"
        elif section == "options":
            title = row.option_text
            detail = f"{polls.get(row.poll_id, 'Votación')} · {votes.get(row.id, 0)} votos"
        else:
            title = row.title
            detail = (
                f"{row.provider or ''} · {DOMAIN_LABELS.get(row.status, row.status)} · "
                f"{row.reservation_date} · {row.amount} COP"
            )

        items.append(DiagnosticRow(id=row.id, title=title, detail=detail))

    return Page[DiagnosticRow](
        items=items,
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
    )
