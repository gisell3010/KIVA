from typing import Annotated

from fastapi import APIRouter, Query

from app.api.dependencies import (
    DbSession,
    Pagination,
    PathId,
    SupportUser,
)
from app.schemas.admin import SupportDashboardRead
from app.schemas.common import Page
from app.schemas.user import GlobalRole, UserRead, UserStatus
from app.services import admin_service

router = APIRouter(prefix="/support", tags=["Soporte"])


@router.get(
    "/dashboard",
    response_model=SupportDashboardRead,
)
def get_dashboard(db: DbSession, actor: SupportUser):
    return admin_service.get_support_dashboard(
        db,
        actor_id=actor.id,
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