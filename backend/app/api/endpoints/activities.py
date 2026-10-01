from fastapi import APIRouter, Response

from app.api.dependencies import (
    CurrentUser,
    DbSession,
    Pagination,
    PathId,
)
from app.schemas.activity import (
    ActivityCreate,
    ActivityRead,
    ActivityUpdate,
)
from app.schemas.common import Page
from app.services import activity_service

router = APIRouter(
    prefix="/trips/{trip_id}/activities",
    tags=["Actividades"],
)


@router.get("", response_model=Page[ActivityRead])
def list_activities(
    trip_id: PathId,
    db: DbSession,
    user: CurrentUser,
    pagination: Pagination,
):
    return activity_service.list_activities(
        db,
        actor_id=user.id,
        trip_id=trip_id,
        pagination=pagination,
    )


@router.post(
    "",
    response_model=ActivityRead,
    status_code=201,
)
def create_activity(
    trip_id: PathId,
    data: ActivityCreate,
    db: DbSession,
    user: CurrentUser,
):
    return activity_service.create_activity(
        db,
        actor_id=user.id,
        trip_id=trip_id,
        data=data,
    )


@router.get("/{activity_id}", response_model=ActivityRead)
def get_activity(
    trip_id: PathId,
    activity_id: PathId,
    db: DbSession,
    user: CurrentUser,
):
    return activity_service.get_activity(
        db,
        actor_id=user.id,
        trip_id=trip_id,
        activity_id=activity_id,
    )


@router.patch("/{activity_id}", response_model=ActivityRead)
def update_activity(
    trip_id: PathId,
    activity_id: PathId,
    data: ActivityUpdate,
    db: DbSession,
    user: CurrentUser,
):
    return activity_service.update_activity(
        db,
        actor_id=user.id,
        trip_id=trip_id,
        activity_id=activity_id,
        data=data,
    )


@router.delete("/{activity_id}", status_code=204)
def delete_activity(
    trip_id: PathId,
    activity_id: PathId,
    db: DbSession,
    user: CurrentUser,
):
    activity_service.delete_activity(
        db,
        actor_id=user.id,
        trip_id=trip_id,
        activity_id=activity_id,
    )

    return Response(status_code=204)