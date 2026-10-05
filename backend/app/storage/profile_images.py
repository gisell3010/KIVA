import re
from pathlib import Path
from typing import BinaryIO

from app.core.exceptions import AppError
from app.storage import _images

_KEY_PATTERN = re.compile(r"(?:profiles/[0-9a-f]{48}\.jpg|cloudinary:kiva/profiles/[0-9a-f]{48})")


def _validate_key(key: str) -> None:
    if not isinstance(key, str) or _KEY_PATTERN.fullmatch(key) is None:
        raise AppError(
            "Referencia de imagen inválida.",
            400,
            "INVALID_IMAGE_PATH",
        )


def store_image(stream: BinaryIO) -> str:
    return _images.store_image(stream, "profiles")


def existing_image(key: str) -> Path | bytes:
    _validate_key(key)
    return _images.existing_image(key)


def remove_image(key: str) -> None:
    _validate_key(key)
    _images.remove_image(key)