from sqlalchemy import select

from app.models.reservation import Reservation
from app.schemas.reservation import ReservationRead
from app.services.catalog_service import get_reservation_type
from app.services._shared import (
    MANAGERS,
    allow,
    apply_patch,
    atomic,
    audit,
    editable,
    fail,
    page,
    saved,
    trip_access,
    trip_item,
)


def list_reservations(db, *, actor_id, trip_id, pagination):
    trip_access(db, actor_id, trip_id)

    return page(
        db,
        select(Reservation)
        .where(Reservation.trip_id == trip_id)
        .order_by(
            Reservation.reservation_date.nulls_last(),
            Reservation.id,
        ),
        pagination,
        ReservationRead,
    )


def get_reservation(
    db,
    *,
    actor_id,
    trip_id,
    reservation_id,
):
    _, _, item = trip_item(
        db,
        actor_id,
        trip_id,
        Reservation,
        reservation_id,
    )

    return ReservationRead.model_validate(item)


@atomic
def create_reservation(db, *, actor_id, trip_id, data):
    trip, member = trip_access(
        db, actor_id, trip_id, lock=True
    )

    allow(member.role, MANAGERS)
    editable(trip)
    get_reservation_type(db, data.type_id)

    item = Reservation(
        trip_id=trip_id,
        status="PENDING",
        **data.model_dump(),
    )

    db.add(item)
    result = saved(db, item, ReservationRead)
    audit(db, actor_id, "RESERVATION_CREATE", item)

    return result


@atomic
def update_reservation(
    db,
    *,
    actor_id,
    trip_id,
    reservation_id,
    data,
):
    trip, member, item = trip_item(
        db,
        actor_id,
        trip_id,
        Reservation,
        reservation_id,
        lock=True,
    )

    allow(member.role, MANAGERS)
    editable(trip)

    changes = data.model_dump(exclude_unset=True)

    if "type_id" in changes:
        get_reservation_type(db, data.type_id)

    transitions = {
        "PENDING": {"PENDING", "CONFIRMED", "CANCELLED"},
        "CONFIRMED": {"CONFIRMED", "CANCELLED"},
        "CANCELLED": {"CANCELLED"},
    }

    if changes.get("status", item.status) not in transitions[item.status]:
        fail(
            "El cambio de estado no está permitido.",
            "INVALID_STATUS",
        )

    apply_patch(item, data)
    audit(db, actor_id, "RESERVATION_UPDATE", item)

    return saved(db, item, ReservationRead)


@atomic
def delete_reservation(
    db,
    *,
    actor_id,
    trip_id,
    reservation_id,
):
    trip, member, item = trip_item(
        db,
        actor_id,
        trip_id,
        Reservation,
        reservation_id,
        lock=True,
    )

    allow(member.role, MANAGERS)
    editable(trip)

    audit(db, actor_id, "RESERVATION_DELETE", item)
    db.delete(item)