from typing import Annotated

from fastapi import APIRouter, Query, Response

from app.api.dependencies import (
    AdminUser,
    DbSession,
    Pagination,
    PathId,
    clear_refresh_cookie,
)
from app.schemas.common import Page
from app.schemas.dashboard import AdminDashboardRead
from app.schemas.group import GroupRead
from app.schemas.trip import TripRead, TripStatus
from app.schemas.user import (
    GlobalRole,
    UserAdminUpdate,
    UserRead,
    UserStatus,
)
from app.services import (
    admin_service,
    dashboard_service,
    user_service,
)

router = APIRouter(prefix="/admin", tags=["Administración"])


@router.get("/dashboard", response_model=AdminDashboardRead)
def get_dashboard(db: DbSession, actor: AdminUser):
    return dashboard_service.get_admin_dashboard(
        db,
        actor_id=actor.id,
    )


@router.get("/users", response_model=Page[UserRead])
def list_users(
    db: DbSession,
    actor: AdminUser,
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
    actor: AdminUser,
):
    return admin_service.get_user(
        db,
        actor_id=actor.id,
        user_id=user_id,
    )


@router.patch("/users/{user_id}", response_model=UserRead)
def update_user(
    user_id: PathId,
    data: UserAdminUpdate,
    db: DbSession,
    actor: AdminUser,
    response: Response,
):
    result = user_service.admin_update_user(
        db,
        actor_id=actor.id,
        user_id=user_id,
        data=data,
    )

    if user_id == actor.id:
        clear_refresh_cookie(response)

    return result


@router.get("/groups", response_model=Page[GroupRead])
def list_groups(
    db: DbSession,
    actor: AdminUser,
    pagination: Pagination,
    q: Annotated[
        str | None,
        Query(min_length=1, max_length=120),
    ] = None,
):
    return admin_service.list_groups(
        db,
        actor_id=actor.id,
        pagination=pagination,
        q=q,
    )


@router.get("/trips", response_model=Page[TripRead])
def list_trips(
    db: DbSession,
    actor: AdminUser,
    pagination: Pagination,
    q: Annotated[
        str | None,
        Query(min_length=1, max_length=150),
    ] = None,
    status: TripStatus | None = None,
):
    return admin_service.list_trips(
        db,
        actor_id=actor.id,
        pagination=pagination,
        q=q,
        status=status,
    )