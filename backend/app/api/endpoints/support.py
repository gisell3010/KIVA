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

from fastapi import Response
from app.schemas.group import GroupRead
from app.schemas.trip import TripRead
from app.services import support_service


@router.get('/users/{user_id}/groups', response_model=Page[GroupRead])
def user_groups(user_id: PathId, db: DbSession, actor: SupportUser, pagination: Pagination):
    return support_service.user_groups(db, actor_id=actor.id, user_id=user_id, pagination=pagination)


@router.get('/users/{user_id}/trips', response_model=Page[TripRead])
def user_trips(user_id: PathId, db: DbSession, actor: SupportUser, pagination: Pagination):
    return support_service.user_trips(db, actor_id=actor.id, user_id=user_id, pagination=pagination)


@router.post('/users/{user_id}/revoke-sessions', status_code=204)
def revoke_sessions(user_id: PathId, db: DbSession, actor: SupportUser):
    support_service.revoke_sessions(db, actor_id=actor.id, user_id=user_id)
    return Response(status_code=204)


@router.get('/trips/{trip_id}', response_model=TripRead)
def trip_info(trip_id: PathId, db: DbSession, actor: SupportUser):
    return support_service.trip_info(db, actor_id=actor.id, trip_id=trip_id)


@router.get('/trips/{trip_id}/diagnostic/{section}', response_model=Page[support_service.DiagnosticRow])
def diagnostic(trip_id: PathId, section: support_service.Section, db: DbSession,
               actor: SupportUser, pagination: Pagination):
    return support_service.diagnostic(db, actor_id=actor.id, trip_id=trip_id,
                                      section=section, pagination=pagination)
