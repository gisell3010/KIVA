from typing import Annotated

from fastapi import APIRouter, Query, Response
from pydantic import AwareDatetime
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.api.dependencies import (
    DbSession,
    Pagination,
    SuperAdminUser,
)
from app.schemas.admin import SystemConfigRead
from app.schemas.audit_log import AuditLogRead
from app.schemas.common import Page
from app.schemas.dashboard import AdminDashboardRead
from app.schemas.health import ReadinessRead
from app.services import (
    admin_service,
    audit_service,
    dashboard_service,
)

router = APIRouter(
    prefix="/super-admin",
    tags=["Superadministración"],
)


@router.get("/dashboard", response_model=AdminDashboardRead)
def get_dashboard(db: DbSession, actor: SuperAdminUser):
    return dashboard_service.get_admin_dashboard(
        db,
        actor_id=actor.id,
    )


@router.get("/config", response_model=SystemConfigRead)
def get_config(db: DbSession, actor: SuperAdminUser):
    return admin_service.get_system_config(
        db,
        actor_id=actor.id,
    )


@router.get("/audit-logs", response_model=Page[AuditLogRead])
def list_audit_logs(
    db: DbSession,
    actor: SuperAdminUser,
    pagination: Pagination,
    user_id: Annotated[
        int | None,
        Query(gt=0, le=2_147_483_647),
    ] = None,
    action: Annotated[
        str | None,
        Query(min_length=1, max_length=100),
    ] = None,
    entity: Annotated[
        str | None,
        Query(min_length=1, max_length=80),
    ] = None,
    entity_id: Annotated[
        int | None,
        Query(gt=0, le=2_147_483_647),
    ] = None,
    q: Annotated[str | None, Query(min_length=1, max_length=150)] = None,
    created_from: AwareDatetime | None = None,
    created_to: AwareDatetime | None = None,
):
    return audit_service.list_audit_logs(
        db,
        actor_id=actor.id,
        pagination=pagination,
        user_id=user_id,
        q=q,
        action=action,
        entity=entity,
        entity_id=entity_id,
        created_from=created_from,
        created_to=created_to,
    )


@router.get(
    "/health",
    response_model=ReadinessRead,
    responses={503: {"model": ReadinessRead}},
)
def health(
    response: Response,
    actor: SuperAdminUser,
    db: DbSession,
):
    try:
        db.execute(text("SELECT 1"))

    except SQLAlchemyError:
        response.status_code = 503

        return ReadinessRead(
            status="error",
            database="unavailable",
        )

    return ReadinessRead(
        status="ok",
        database="ok",
    )