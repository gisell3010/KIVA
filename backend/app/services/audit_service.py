from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.exceptions import AppError
from app.core.permissions import require_global_role
from app.models.audit_log import AuditLog
from app.models.user import User
from app.schemas.audit_log import AuditLogRead
from app.schemas.common import Page, PaginationParams, as_utc


def record_action(
    db: Session,
    *,
    user_id: int | None,
    action: str,
    entity: str | None = None,
    entity_id: int | None = None,
) -> AuditLog:
    if not action or len(action) > 100:
        raise ValueError("Acción de auditoría inválida.")

    if entity is not None and len(entity) > 80:
        raise ValueError("Entidad de auditoría inválida.")

    entry = AuditLog(
        user_id=user_id,
        action=action,
        entity=entity,
        entity_id=entity_id,
    )
    db.add(entry)
    return entry


def list_audit_logs(
    db: Session,
    *,
    actor_id: int,
    pagination: PaginationParams,
    user_id: int | None = None,
    action: str | None = None,
    entity: str | None = None,
    entity_id: int | None = None,
    created_from: datetime | None = None,
    created_to: datetime | None = None,
) -> Page[AuditLogRead]:
    actor = db.scalar(
        select(User)
        .where(User.id == actor_id)
        .execution_options(populate_existing=True)
    )

    if actor is None or actor.status != "ACTIVE":
        raise AppError(
            "Cuenta no disponible.",
            403,
            "ACCOUNT_INACTIVE",
        )

    require_global_role(actor.role, ("SUPER_ADMIN",))

    conditions = []

    for column, value in (
        (AuditLog.user_id, user_id),
        (AuditLog.action, action),
        (AuditLog.entity, entity),
        (AuditLog.entity_id, entity_id),
    ):
        if value is not None:
            conditions.append(column == value)

    if created_from is not None:
        created_from = as_utc(created_from).replace(tzinfo=None)
        conditions.append(AuditLog.created_at >= created_from)

    if created_to is not None:
        created_to = as_utc(created_to).replace(tzinfo=None)
        conditions.append(AuditLog.created_at <= created_to)

    if created_from and created_to and created_from > created_to:
        raise AppError(
            "El intervalo de fechas no es válido.",
            422,
            "INVALID_DATES",
        )

    total = db.scalar(
        select(func.count())
        .select_from(AuditLog)
        .where(*conditions)
    ) or 0

    entries = db.scalars(
        select(AuditLog)
        .where(*conditions)
        .order_by(AuditLog.created_at.desc(), AuditLog.id.desc())
        .offset((pagination.page - 1) * pagination.page_size)
        .limit(pagination.page_size)
    ).all()

    return Page[AuditLogRead](
        items=[
            AuditLogRead.model_validate(entry)
            for entry in entries
        ],
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
    )