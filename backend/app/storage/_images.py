from io import BytesIO
from pathlib import Path
from secrets import token_hex
from typing import BinaryIO
from urllib.request import urlopen
import warnings

import cloudinary
import cloudinary.uploader
from cloudinary import CloudinaryImage
from PIL import Image, ImageOps, UnidentifiedImageError

from app.core.config import get_settings
from app.core.exceptions import AppError

CLOUDINARY_PREFIX = "cloudinary:"

def image_path(key: str) -> Path:
    root = Path(get_settings().UPLOADS_DIR).resolve()
    path = (root / key).resolve()

    if not path.is_relative_to(root) or path == root:
        raise AppError(
            "Ruta de imagen inválida.",
            400,
            "INVALID_IMAGE_PATH",
        )

    return path

def _processed_image(stream: BinaryIO) -> bytes:
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
            warnings.simplefilter("error", Image.DecompressionBombWarning)

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
                clean.save(output, format="JPEG", quality=85, optimize=True)
                return output.getvalue()

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

def _cloudinary_config() -> None:
    settings = get_settings()
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY.get_secret_value(),
        api_secret=settings.CLOUDINARY_API_SECRET.get_secret_value(),
        secure=True,
    )

def _cloudinary_public_id(key: str) -> str:
    if not key.startswith(CLOUDINARY_PREFIX):
        raise AppError(
            "Referencia de imagen inválida.",
            400,
            "INVALID_IMAGE_PATH",
        )
    return key.removeprefix(CLOUDINARY_PREFIX)

def store_image(stream: BinaryIO, folder: str) -> str:
    settings = get_settings()
    image = _processed_image(stream)
    token = token_hex(24)

    if settings.IMAGE_STORAGE == "cloudinary":
        _cloudinary_config()
        public_id = f"kiva/{folder}/{token}"
        try:
            result = cloudinary.uploader.upload(
                BytesIO(image),
                public_id=public_id,
                resource_type="image",
                format="jpg",
                overwrite=False,
            )
        except Exception as exc:
            raise AppError(
                "No fue posible almacenar la imagen.",
                502,
                "IMAGE_STORAGE_ERROR",
            ) from exc

        if not result.get("public_id"):
            raise AppError(
                "No fue posible almacenar la imagen.",
                502,
                "IMAGE_STORAGE_ERROR",
            )
        return f"{CLOUDINARY_PREFIX}{public_id}"

    key = f"{folder}/{token}.jpg"
    path = image_path(key)
    path.parent.mkdir(parents=True, exist_ok=True)

    try:
        with path.open("xb") as destination:
            destination.write(image)
    except OSError:
        path.unlink(missing_ok=True)
        raise

    return key

def remove_image(key: str) -> None:
    if key.startswith(CLOUDINARY_PREFIX):
        _cloudinary_config()
        try:
            result = cloudinary.uploader.destroy(
                _cloudinary_public_id(key),
                resource_type="image",
                invalidate=True,
            )
        except Exception as exc:
            raise OSError("Cloudinary no pudo eliminar la imagen.") from exc

        if result.get("result") not in {"ok", "not found"}:
            raise OSError("Cloudinary no pudo eliminar la imagen.")
        return

    image_path(key).unlink(missing_ok=True)

def existing_image(key: str) -> Path | bytes:
    if key.startswith(CLOUDINARY_PREFIX):
        settings = get_settings()
        if settings.IMAGE_STORAGE == "cloudinary":
            _cloudinary_config()
        public_id = _cloudinary_public_id(key)
        url = CloudinaryImage(public_id).build_url(secure=True, format="jpg")
        try:
            with urlopen(url, timeout=10) as response:
                data = response.read(settings.MAX_IMAGE_BYTES * 2)
        except OSError:
            raise AppError(
                "Imagen no disponible.",
                404,
                "IMAGE_NOT_FOUND",
            ) from None
        if not data:
            raise AppError("Imagen no disponible.", 404, "IMAGE_NOT_FOUND")
        return data

    path = image_path(key)
    if not path.is_file():
        raise AppError(
            "Imagen no disponible.",
            404,
            "IMAGE_NOT_FOUND",
        )
    return path