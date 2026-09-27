from sqlalchemy import select

from app.core.config import get_settings
from app.models.destination import Destination
from app.models.destination_photo import DestinationPhoto
from app.schemas.destination_photo import DestinationPhotoRead
from app.services._shared import (
    MANAGERS,
    after_transaction,
    allow,
    atomic,
    audit,
    fail,
    required,
    trip_item,
)
from app.storage.destination_images import (
    existing_image,
    remove_image,
    store_image,
)


def _read(photo, trip_id):
    prefix = get_settings().API_PREFIX

    return DestinationPhotoRead(
        id=photo.id,
        destination_id=photo.destination_id,
        uploaded_by_user_id=photo.uploaded_by_user_id,
        image_url=(
            f"{prefix}/trips/{trip_id}"
            f"/destinations/{photo.destination_id}"
            f"/photos/{photo.id}/file"
        ),
        position=photo.position,
        created_at=photo.created_at,
    )


def _photos(db, destination_id):
    return list(
        db.scalars(
            select(DestinationPhoto)
            .where(
                DestinationPhoto.destination_id == destination_id
            )
            .order_by(
                DestinationPhoto.position,
                DestinationPhoto.id,
            )
        )
    )


def list_photos(db, *, actor_id, trip_id, destination_id):
    trip_item(
        db,
        actor_id,
        trip_id,
        Destination,
        destination_id,
    )

    return [
        _read(photo, trip_id)
        for photo in _photos(db, destination_id)
    ]


@atomic
def upload_photo(
    db,
    *,
    actor_id,
    trip_id,
    destination_id,
    stream,
):
    trip_item(
        db,
        actor_id,
        trip_id,
        Destination,
        destination_id,
        lock=True,
    )

    photos = _photos(db, destination_id)

    if len(photos) >= get_settings().MAX_DESTINATION_PHOTOS:
        fail(
            "El destino alcanzó el límite de fotos.",
            "PHOTO_LIMIT",
        )

    position = max(
        (photo.position for photo in photos),
        default=0,
    ) + 1

    if position > 2_147_483_647:
        fail(
            "Reordena las fotos antes de agregar otra.",
            "PHOTO_POSITION",
        )

    key = store_image(stream)

    after_transaction(
        db,
        lambda: remove_image(key),
        rollback=True,
    )

    photo = DestinationPhoto(
        destination_id=destination_id,
        uploaded_by_user_id=actor_id,
        file_path=key,
        position=position,
    )

    db.add(photo)
    db.flush()

    audit(db, actor_id, "DESTINATION_PHOTO_UPLOAD", photo)

    return _read(photo, trip_id)


def get_photo_file(
    db,
    *,
    actor_id,
    trip_id,
    destination_id,
    photo_id,
):
    trip_item(
        db,
        actor_id,
        trip_id,
        Destination,
        destination_id,
    )

    photo = required(
        db,
        select(DestinationPhoto).where(
            DestinationPhoto.id == photo_id,
            DestinationPhoto.destination_id == destination_id,
        ),
    )

    return existing_image(photo.file_path)


@atomic
def delete_photo(
    db,
    *,
    actor_id,
    trip_id,
    destination_id,
    photo_id,
):
    _, member, _ = trip_item(
        db,
        actor_id,
        trip_id,
        Destination,
        destination_id,
        lock=True,
    )

    photo = required(
        db,
        select(DestinationPhoto).where(
            DestinationPhoto.id == photo_id,
            DestinationPhoto.destination_id == destination_id,
        ),
    )

    if photo.uploaded_by_user_id != actor_id:
        allow(member.role, MANAGERS)

    key = photo.file_path

    after_transaction(
        db,
        lambda: remove_image(key),
    )

    audit(db, actor_id, "DESTINATION_PHOTO_DELETE", photo)
    db.delete(photo)


@atomic
def reorder_photos(
    db,
    *,
    actor_id,
    trip_id,
    destination_id,
    data,
):
    _, member, destination = trip_item(
        db,
        actor_id,
        trip_id,
        Destination,
        destination_id,
        lock=True,
    )

    if destination.proposed_by_user_id != actor_id:
        allow(member.role, MANAGERS)

    photos = _photos(db, destination_id)
    by_id = {photo.id: photo for photo in photos}

    if set(data.photo_ids) != set(by_id):
        fail(
            "Incluye todas las fotos del destino una sola vez.",
            "INVALID_PHOTO_ORDER",
            422,
        )

    offset = max(
        (photo.position for photo in photos),
        default=0,
    )

    if offset + len(photos) > 2_147_483_647:
        fail(
            "Las posiciones exceden el límite permitido.",
            "PHOTO_POSITION",
        )

    for index, photo in enumerate(photos, 1):
        photo.position = offset + index

    db.flush()

    for position, photo_id in enumerate(data.photo_ids, 1):
        by_id[photo_id].position = position

    db.flush()

    audit(
        db,
        actor_id,
        "DESTINATION_PHOTOS_REORDER",
        destination,
    )

    return [
        _read(by_id[photo_id], trip_id)
        for photo_id in data.photo_ids
    ]