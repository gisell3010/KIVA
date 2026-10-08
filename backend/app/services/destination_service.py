from sqlalchemy import select

from app.models.destination import Destination
from app.models.destination_photo import DestinationPhoto
from app.schemas.destination import DestinationRead
from app.services.notification_service import notify_trip_members
from app.services._shared import (
    MANAGERS,
    after_transaction,
    allow,
    apply_patch,
    atomic,
    audit,
    editable,
    page,
    saved,
    trip_access,
    trip_item,
)
from app.storage.destination_images import remove_image


def list_destinations(db, *, actor_id, trip_id, pagination):
    trip_access(db, actor_id, trip_id)

    return page(
        db,
        select(Destination)
        .where(Destination.trip_id == trip_id)
        .order_by(Destination.id),
        pagination,
        DestinationRead,
    )


def get_destination(
    db,
    *,
    actor_id,
    trip_id,
    destination_id,
):
    _, _, item = trip_item(
        db,
        actor_id,
        trip_id,
        Destination,
        destination_id,
    )

    return DestinationRead.model_validate(item)


@atomic
def create_destination(db, *, actor_id, trip_id, data):
    trip, _ = trip_access(
        db,
        actor_id,
        trip_id,
        lock=True,
    )

    editable(trip)

    item = Destination(
        trip_id=trip_id,
        proposed_by_user_id=actor_id,
        is_selected=False,
        **data.model_dump(),
    )

    db.add(item)

    result = saved(db, item, DestinationRead)
    audit(db, actor_id, "DESTINATION_CREATE", item)

    return result


@atomic
def update_destination(
    db,
    *,
    actor_id,
    trip_id,
    destination_id,
    data,
):
    trip, member, item = trip_item(
        db,
        actor_id,
        trip_id,
        Destination,
        destination_id,
        lock=True,
    )

    editable(trip)

    if item.proposed_by_user_id != actor_id or item.is_selected:
        allow(member.role, MANAGERS)

    apply_patch(item, data)
    audit(db, actor_id, "DESTINATION_UPDATE", item)

    return saved(db, item, DestinationRead)


@atomic
def select_destination(
    db,
    *,
    actor_id,
    trip_id,
    destination_id,
    data,
):
    trip, member, item = trip_item(
        db,
        actor_id,
        trip_id,
        Destination,
        destination_id,
        lock=True,
    )

    editable(trip)
    allow(member.role, MANAGERS)

    was_selected = item.is_selected
    item.is_selected = data.is_selected

    if data.is_selected and not was_selected:
        notify_trip_members(
            db,
            action_path=f"/destinos?trip={trip_id}",
            trip_id=trip_id,
            title="Destino seleccionado",
            message=f"{item.place_name}, {item.country} fue seleccionado para {trip.name}.",
            exclude_user_id=actor_id,
        )

    audit(db, actor_id, "DESTINATION_SELECT", item)

    return saved(db, item, DestinationRead)


@atomic
def delete_destination(
    db,
    *,
    actor_id,
    trip_id,
    destination_id,
):
    trip, member, item = trip_item(
        db,
        actor_id,
        trip_id,
        Destination,
        destination_id,
        lock=True,
    )

    editable(trip)

    if item.proposed_by_user_id != actor_id or item.is_selected:
        allow(member.role, MANAGERS)

    paths = db.scalars(
        select(DestinationPhoto.file_path).where(
            DestinationPhoto.destination_id == destination_id
        )
    ).all()

    for key in paths:
        after_transaction(
            db,
            lambda key=key: remove_image(key),
        )

    audit(db, actor_id, "DESTINATION_DELETE", item)
    db.delete(item)