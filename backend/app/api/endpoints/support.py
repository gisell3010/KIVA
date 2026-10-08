from typing import Annotated

from fastapi import APIRouter, Query

from app.api.dependencies import (
    DbSession,
    Pagination,
    PathId,
    SupportUser,
)
from app.schemas.common import Page
from app.schemas.group import GroupRead
from app.schemas.support import (
    SupportCategory, SupportEscalate, SupportAssign, SupportMessageCreate, SupportMessageRead, SupportReporterRead,
    SupportDashboardRead,
    SupportReportDetail,
    SupportReportRead,
    SupportReportUpdate,
    SupportStatus,
    SupportTripRead,
)
from app.schemas.trip import TripRead
from app.schemas.user import GlobalRole, UserRead, UserStatus
from app.services import admin_service, support_service

router = APIRouter(prefix="/support", tags=["Soporte"])


@router.get(
    "/dashboard",
    response_model=SupportDashboardRead,
)
def get_dashboard(db: DbSession, actor: SupportUser):
    return support_service.dashboard(
        db,
        actor_id=actor.id,
    )


@router.get("/reports", response_model=Page[SupportReportRead])
def list_reports(
    db: DbSession,
    actor: SupportUser,
    pagination: Pagination,
    q: Annotated[
        str | None,
        Query(min_length=1, max_length=150),
    ] = None,
    status: SupportStatus | None = None,
    category: SupportCategory | None = None,
    assigned_to_me: bool = False,
    unassigned: bool = False,
):
    return support_service.list_reports(
        db,
        actor_id=actor.id,
        pagination=pagination,
        q=q,
        status=status,
        category=category,
        assigned_to_me=assigned_to_me,
        unassigned=unassigned,
    )


@router.get(
    "/reports/{report_id}",
    response_model=SupportReportDetail,
)
def get_report(
    report_id: PathId,
    db: DbSession,
    actor: SupportUser,
):
    return support_service.get_report(
        db,
        actor_id=actor.id,
        report_id=report_id,
    )


@router.post(
    "/reports/{report_id}/assign-self",
    response_model=SupportReportDetail,
)
def assign_self(
    report_id: PathId,
    db: DbSession,
    actor: SupportUser,
):
    return support_service.assign_self(
        db,
        actor_id=actor.id,
        report_id=report_id,
    )


@router.patch(
    "/reports/{report_id}",
    response_model=SupportReportDetail,
)
def update_report(
    report_id: PathId,
    data: SupportReportUpdate,
    db: DbSession,
    actor: SupportUser,
):
    return support_service.update_report(
        db,
        actor_id=actor.id,
        report_id=report_id,
        data=data,
    )


@router.post(
    "/reports/{report_id}/escalate",
    response_model=SupportReportDetail,
)
def escalate_report(
    report_id: PathId,
    data: SupportEscalate,
    db: DbSession,
    actor: SupportUser,
):
    return support_service.escalate_report(
        db,
        reason=data.reason,
        actor_id=actor.id,
        report_id=report_id,
    )


@router.get("/users", response_model=Page[UserRead])
def list_users(
    db: DbSession,
    actor: SupportUser,
    pagination: Pagination,
    q: Annotated[
        str | None,
        Query(min_length=1, max_length=150),
    ] = None,
    role: GlobalRole | None = None,
    status: UserStatus | None = None,
):
    return admin_service.list_users(
        db,
        actor_id=actor.id,
        pagination=pagination,
        q=q,
        role=role,
        status=status,
    )


@router.get("/users/{user_id}", response_model=UserRead)
def get_user(
    user_id: PathId,
    db: DbSession,
    actor: SupportUser,
):
    return admin_service.get_user(
        db,
        actor_id=actor.id,
        user_id=user_id,
    )


@router.get(
    "/users/{user_id}/groups",
    response_model=Page[GroupRead],
)
def user_groups(
    user_id: PathId,
    db: DbSession,
    actor: SupportUser,
    pagination: Pagination,
):
    return support_service.user_groups(
        db,
        actor_id=actor.id,
        user_id=user_id,
        pagination=pagination,
    )


@router.get(
    "/users/{user_id}/trips",
    response_model=Page[TripRead],
)
def user_trips(
    user_id: PathId,
    db: DbSession,
    actor: SupportUser,
    pagination: Pagination,
):
    return support_service.user_trips(
        db,
        actor_id=actor.id,
        user_id=user_id,
        pagination=pagination,
    )


@router.get(
    "/trips/{trip_id}",
    response_model=SupportTripRead,
)
def trip_info(
    trip_id: PathId,
    db: DbSession,
    actor: SupportUser,
):
    return support_service.trip_info(
        db,
        actor_id=actor.id,
        trip_id=trip_id,
    )


@router.get(
    "/trips/{trip_id}/diagnostic/{section}",
    response_model=Page[support_service.DiagnosticRow],
)
def diagnostic(
    trip_id: PathId,
    section: support_service.Section,
    db: DbSession,
    actor: SupportUser,
    pagination: Pagination,
):
    return support_service.diagnostic(
        db,
        actor_id=actor.id,
        trip_id=trip_id,
        section=section,
        pagination=pagination,
    )


@router.get("/agents", response_model=list[SupportReporterRead])
def agents(db: DbSession, actor: SupportUser):
    return support_service.list_agents(db, actor_id=actor.id)


@router.post("/reports/{report_id}/assign", response_model=SupportReportDetail)
def assign(report_id: PathId, data: SupportAssign, db: DbSession, actor: SupportUser):
    return support_service.assign_report(db, actor_id=actor.id, report_id=report_id, user_id=data.user_id)


@router.get("/reports/{report_id}/messages", response_model=Page[SupportMessageRead])
def messages(report_id: PathId, db: DbSession, actor: SupportUser, pagination: Pagination):
    return support_service.list_messages(db, actor_id=actor.id, report_id=report_id, pagination=pagination, staff=True)


@router.post("/reports/{report_id}/messages", response_model=SupportMessageRead, status_code=201)
def add_message(report_id: PathId, data: SupportMessageCreate, db: DbSession, actor: SupportUser):
    return support_service.add_message(db, actor_id=actor.id, report_id=report_id, data=data, staff=True)
