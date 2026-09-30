from fastapi import APIRouter, Response

from app.api.dependencies import (
    CurrentUser,
    DbSession,
    Pagination,
    PathId,
)
from app.schemas.common import Page
from app.schemas.reservation import (
    ReservationCreate,
    ReservationRead,
    ReservationUpdate,
)
from app.services import reservation_service

router = APIRouter(
    prefix="/trips/{trip_id}/reservations",
    tags=["Reservas"],
)


@router.get("", response_model=Page[ReservationRead])
def list_reservations(
    trip_id: PathId,
    db: DbSession,
    user: CurrentUser,
    pagination: Pagination,
):
    return reservation_service.list_reservations(
        db,
        actor_id=user.id,
        trip_id=trip_id,
        pagination=pagination,
    )


@router.post(
    "",
    response_model=ReservationRead,
    status_code=201,
)
def create_reservation(
    trip_id: PathId,
    data: ReservationCreate,
    db: DbSession,
    user: CurrentUser,
):
    return reservation_service.create_reservation(
        db,
        actor_id=user.id,
        trip_id=trip_id,
        data=data,
    )


@router.get(
    "/{reservation_id}",
    response_model=ReservationRead,
)
def get_reservation(
    trip_id: PathId,
    reservation_id: PathId,
    db: DbSession,
    user: CurrentUser,
):
    return reservation_service.get_reservation(
        db,
        actor_id=user.id,
        trip_id=trip_id,
        reservation_id=reservation_id,
    )


@router.patch(
    "/{reservation_id}",
    response_model=ReservationRead,
)
def update_reservation(
    trip_id: PathId,
    reservation_id: PathId,
    data: ReservationUpdate,
    db: DbSession,
    user: CurrentUser,
):
    return reservation_service.update_reservation(
        db,
        actor_id=user.id,
        trip_id=trip_id,
        reservation_id=reservation_id,
        data=data,
    )


@router.delete("/{reservation_id}", status_code=204)
def delete_reservation(
    trip_id: PathId,
    reservation_id: PathId,
    db: DbSession,
    user: CurrentUser,
):
    reservation_service.delete_reservation(
        db,
        actor_id=user.id,
        trip_id=trip_id,
        reservation_id=reservation_id,
    )

    return Response(status_code=204)