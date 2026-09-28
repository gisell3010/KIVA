from io import BytesIO
from pathlib import Path
from secrets import token_hex
import warnings

from PIL import Image, ImageOps, UnidentifiedImageError

from app.core.config import get_settings
from app.core.exceptions import AppError


def image_path(key):
    root = Path(get_settings().UPLOADS_DIR).resolve()
    path = (root / key).resolve()

    if not path.is_relative_to(root) or path == root:
        raise AppError(
            "Ruta de imagen inválida.",
            400,
            "INVALID_IMAGE_PATH",
        )

    return path


def store_image(stream, folder):
    settings = get_settings()
    data = stream.read(settings.MAX_IMAGE_BYTES + 1)

    if not data or len(data) > settings.MAX_IMAGE_BYTES:
        raise AppError(
            "La imagen está vacía o supera el tamaño permitido.",
            413,
            "IMAGE_SIZE",
        )

    try:
        with warnings.catch_warnings():
            warnings.simplefilter(
                "error",
                Image.DecompressionBombWarning,
            )

            with Image.open(BytesIO(data)) as original:
                if original.format not in {"JPEG", "PNG", "WEBP"}:
                    raise ValueError("Formato")

                if original.width * original.height > 20_000_000:
                    raise ValueError("Dimensiones")

                if getattr(original, "is_animated", False):
                    raise ValueError("Animación")

                original.verify()

            with Image.open(BytesIO(data)) as original:
                clean = ImageOps.exif_transpose(original).convert("RGB")
                clean.thumbnail((2400, 2400))

                output = BytesIO()
                clean.save(output, format="JPEG", quality=85)

    except (
        UnidentifiedImageError,
        OSError,
        ValueError,
        Image.DecompressionBombError,
        Image.DecompressionBombWarning,
    ):
        raise AppError(
            "Utiliza una imagen JPEG, PNG o WEBP válida, sin animación.",
            422,
            "INVALID_IMAGE",
        ) from None

    key = f"{folder}/{token_hex(24)}.jpg"
    path = image_path(key)
    path.parent.mkdir(parents=True, exist_ok=True)

    try:
        with path.open("xb") as destination:
            destination.write(output.getvalue())
    except OSError:
        path.unlink(missing_ok=True)
        raise

    return key


def remove_image(key):
    image_path(key).unlink(missing_ok=True)


def existing_image(key):
    path = image_path(key)

    if not path.is_file():
        raise AppError(
            "Imagen no disponible.",
            404,
            "IMAGE_NOT_FOUND",
        )

    return path