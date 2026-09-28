from io import BytesIO

import pytest

from app.core.config import get_settings
from app.schemas.destination_photo import DestinationPhotoReorder
from app.services import destination_service
from app.services import destination_photo_service as service


def test_reorder_and_delete_destination_files(
    db,
    scenario,
    destination,
    image_stream,
):
    args = dict(
        actor_id=scenario.member.id,
        trip_id=scenario.trip.id,
        destination_id=destination.id,
    )

    first = service.upload_photo(
        db,
        **args,
        stream=image_stream(),
    )

    second = service.upload_photo(
        db,
        **args,
        stream=image_stream(),
    )

    path = service.get_photo_file(
        db,
        **args,
        photo_id=first.id,
    )

    result = service.reorder_photos(
        db,
        **args,
        data=DestinationPhotoReorder(
            photo_ids=[second.id, first.id]
        ),
    )

    assert [
        (photo.id, photo.position)
        for photo in result
    ] == [
        (second.id, 1),
        (first.id, 2),
    ]

    destination_service.delete_destination(db, **args)

    assert not path.exists()


def test_photos_are_private(
    db,
    scenario,
    destination,
    image_stream,
    expect_error,
):
    photo = service.upload_photo(
        db,
        actor_id=scenario.member.id,
        trip_id=scenario.trip.id,
        destination_id=destination.id,
        stream=image_stream(),
    )

    with expect_error(404):
        service.get_photo_file(
            db,
            actor_id=scenario.outsider.id,
            trip_id=scenario.trip.id,
            destination_id=destination.id,
            photo_id=photo.id,
        )


def test_invalid_content_and_photo_limit(
    db,
    scenario,
    destination,
    image_stream,
    monkeypatch,
    expect_error,
):
    args = dict(
        actor_id=scenario.member.id,
        trip_id=scenario.trip.id,
        destination_id=destination.id,
    )

    with expect_error(422, "INVALID_IMAGE"):
        service.upload_photo(
            db,
            **args,
            stream=BytesIO(b"not an image"),
        )

    monkeypatch.setattr(
        get_settings(),
        "MAX_DESTINATION_PHOTOS",
        1,
    )

    service.upload_photo(
        db,
        **args,
        stream=image_stream(),
    )

    with expect_error(409, "PHOTO_LIMIT"):
        service.upload_photo(
            db,
            **args,
            stream=image_stream(),
        )


def test_failed_commit_removes_new_file(
    db,
    scenario,
    destination,
    image_stream,
    monkeypatch,
    isolated_uploads,
):
    def fail_commit():
        raise RuntimeError("Fallo simulado de guardado")

    monkeypatch.setattr(db, "commit", fail_commit)

    with pytest.raises(RuntimeError):
        service.upload_photo(
            db,
            actor_id=scenario.member.id,
            trip_id=scenario.trip.id,
            destination_id=destination.id,
            stream=image_stream(),
        )

    assert list(isolated_uploads.rglob("*.jpg")) == []