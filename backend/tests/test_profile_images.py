from io import BytesIO

import pytest
from PIL import Image

from app.core.config import get_settings
from app.services import user_service as service
from app.storage import destination_images, profile_images


def test_profile_replacement_removes_old_file(
    db,
    scenario,
    image_stream,
):
    service.upload_profile_image(
        db,
        actor_id=scenario.member.id,
        stream=image_stream(),
    )

    old = service.get_profile_image(
        db,
        actor_id=scenario.member.id,
        user_id=scenario.member.id,
    )

    service.upload_profile_image(
        db,
        actor_id=scenario.member.id,
        stream=image_stream(),
    )

    new = service.get_profile_image(
        db,
        actor_id=scenario.member.id,
        user_id=scenario.member.id,
    )

    assert not old.exists()
    assert new.exists()

    with Image.open(new) as image:
        assert image.format == "JPEG"

    service.delete_profile_image(
        db,
        actor_id=scenario.member.id,
    )

    assert not new.exists()


def test_image_size_limit(monkeypatch, expect_error):
    monkeypatch.setattr(
        get_settings(),
        "MAX_IMAGE_BYTES",
        10,
    )

    with expect_error(413, "IMAGE_SIZE"):
        profile_images.store_image(
            BytesIO(b"x" * 11)
        )


@pytest.mark.parametrize(
    "storage",
    [profile_images, destination_images],
)
def test_path_traversal_rejected(storage, expect_error):
    for key in (
        "../.env",
        "/tmp/image.jpg",
        "profiles/../destinations/image.jpg",
    ):
        with expect_error(400, "INVALID_IMAGE_PATH"):
            storage.existing_image(key)


def test_profile_storage_rejects_destination_keys(
    image_stream,
    expect_error,
):
    key = destination_images.store_image(
        image_stream()
    )

    path = destination_images.existing_image(key)

    with expect_error(400):
        profile_images.remove_image(key)

    assert path.exists()