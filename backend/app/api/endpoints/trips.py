from typing import Annotated, Literal

from fastapi import APIRouter, Query, Response

from app.api.dependencies import (
    CurrentUser,
    DbSession,
    Pagination,
    PathId,
)
from app.schemas.common import OwnershipTransfer, Page
from app.schemas.trip import (
    TripCreate,
    TripMemberAdd,
    TripMemberRead,
    TripMemberUpdate,
    TripRead,
    TripUpdate,
)
from app.services import trip_service

router = APIRouter(prefix="/trips", tags=["Viajes"])


@router.get("", response_model=Page[TripRead])
def list_trips(
    db: DbSession,
    user: CurrentUser,
    pagination: Pagination,
    group_id: Annotated[
        int | None,
        Query(gt=0, le=2_147_483_647),
    ] = None,
    status: Annotated[
        Literal["PLANNING", "CONFIRMED", "COMPLETED", "CANCELLED"] | None,
        Query(),
    ] = None,
):
    return trip_service.list_trips(
        db,
        actor_id=user.id,
        pagination=pagination,
        group_id=group_id,
        status=status,
    )


@router.post("", response_model=TripRead, status_code=201)
def create_trip(
    data: TripCreate,
    db: DbSession,
    user: CurrentUser,
):
    return trip_service.create_trip(
        db,
        actor_id=user.id,
        data=data,
    )


@router.get("/{trip_id}", response_model=TripRead)
def get_trip(
    trip_id: PathId,
    db: DbSession,
    user: CurrentUser,
):
    return trip_service.get_trip(
        db,
        actor_id=user.id,
        trip_id=trip_id,
    )


@router.patch("/{trip_id}", response_model=TripRead)
def update_trip(
    trip_id: PathId,
    data: TripUpdate,
    db: DbSession,
    user: CurrentUser,
):
    return trip_service.update_trip(
        db,
        actor_id=user.id,
        trip_id=trip_id,
        data=data,
    )


@router.delete("/{trip_id}", status_code=204)
def delete_trip(
    trip_id: PathId,
    db: DbSession,
    user: CurrentUser,
):
    trip_service.delete_trip(
        db,
        actor_id=user.id,
        trip_id=trip_id,
    )

    return Response(status_code=204)


@router.get(
    "/{trip_id}/members",
    response_model=Page[TripMemberRead],
)
def list_members(
    trip_id: PathId,
    db: DbSession,
    user: CurrentUser,
    pagination: Pagination,
):
    return trip_service.list_members(
        db,
        actor_id=user.id,
        trip_id=trip_id,
        pagination=pagination,
    )


@router.post(
    "/{trip_id}/members",
    response_model=TripMemberRead,
    status_code=201,
)
def add_member(
    trip_id: PathId,
    data: TripMemberAdd,
    db: DbSession,
    user: CurrentUser,
):
    return trip_service.add_member(
        db,
        actor_id=user.id,
        trip_id=trip_id,
        data=data,
    )


@router.patch(
    "/{trip_id}/members/{user_id}",
    response_model=TripMemberRead,
)
def update_member(
    trip_id: PathId,
    user_id: PathId,
    data: TripMemberUpdate,
    db: DbSession,
    user: CurrentUser,
):
    return trip_service.update_member(
        db,
        actor_id=user.id,
        trip_id=trip_id,
        user_id=user_id,
        data=data,
    )


@router.delete(
    "/{trip_id}/members/{user_id}",
    status_code=204,
)
def remove_member(
    trip_id: PathId,
    user_id: PathId,
    db: DbSession,
    user: CurrentUser,
):
    trip_service.remove_member(
        db,
        actor_id=user.id,
        trip_id=trip_id,
        user_id=user_id,
    )

    return Response(status_code=204)


@router.post(
    "/{trip_id}/ownership",
    response_model=TripMemberRead,
)
def transfer_ownership(
    trip_id: PathId,
    data: OwnershipTransfer,
    db: DbSession,
    user: CurrentUser,
):
    return trip_service.transfer_ownership(
        db,
        actor_id=user.id,
        trip_id=trip_id,
        data=data,
    )