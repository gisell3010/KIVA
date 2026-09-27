import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from functools import lru_cache

import jwt
from jwt.exceptions import InvalidTokenError
from pwdlib import PasswordHash

from app.core.config import get_settings
from app.core.exceptions import AppError

password_hasher = PasswordHash.recommended()


def hash_password(password: str) -> str:
    return password_hasher.hash(password)


@lru_cache
def _dummy_hash() -> str:
    return hash_password(secrets.token_urlsafe(32))


def verify_password(password: str, stored_hash: str | None) -> bool:
    valid = password_hasher.verify(password, stored_hash or _dummy_hash())
    return stored_hash is not None and valid


def _create_token(
    user_id: int,
    session_id: int,
    token_type: str,
    expires_at: datetime,
) -> str:
    settings = get_settings()

    payload = {
        "sub": str(user_id),
        "sid": str(session_id),
        "type": token_type,
        "iss": settings.JWT_ISSUER,
        "aud": settings.JWT_AUDIENCE,
        "iat": datetime.now(timezone.utc),
        "exp": expires_at,
        "jti": secrets.token_urlsafe(32),
    }

    return jwt.encode(
        payload,
        settings.JWT_SECRET.get_secret_value(),
        algorithm=settings.JWT_ALGORITHM,
    )


def create_access_token(user_id: int, session_id: int) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=get_settings().ACCESS_TOKEN_MINUTES
    )
    return _create_token(user_id, session_id, "access", expires_at)


def create_refresh_token(
    user_id: int,
    session_id: int,
    expires_at: datetime,
) -> str:
    return _create_token(user_id, session_id, "refresh", expires_at)


def _decode_token(token: str, expected_type: str) -> dict:
    settings = get_settings()

    try:
        if not isinstance(token, str) or not token or len(token) > 4096:
            raise ValueError("Token inválido.")

        payload = jwt.decode(
            token,
            settings.JWT_SECRET.get_secret_value(),
            algorithms=[settings.JWT_ALGORITHM],
            issuer=settings.JWT_ISSUER,
            audience=settings.JWT_AUDIENCE,
            options={
                "require": [
                    "sub",
                    "sid",
                    "type",
                    "iss",
                    "aud",
                    "iat",
                    "exp",
                    "jti",
                ]
            },
        )

        if payload["type"] != expected_type:
            raise ValueError("Tipo de token incorrecto.")

        if not isinstance(payload["jti"], str) or not payload["jti"]:
            raise ValueError("Identificador de token inválido.")

        for field in ("sub", "sid"):
            value = payload[field]

            if (
                not isinstance(value, str)
                or not value.isascii()
                or not value.isdigit()
                or len(value) > 10
                or not 0 < int(value) <= 2_147_483_647
            ):
                raise ValueError("Identificador inválido.")

        return payload

    except (InvalidTokenError, ValueError, TypeError):
        raise AppError(
            "La sesión no es válida o ha expirado.",
            status_code=401,
            code="INVALID_TOKEN",
            headers={"WWW-Authenticate": "Bearer"},
        ) from None


def decode_access_token(token: str) -> dict:
    return _decode_token(token, "access")


def decode_refresh_token(token: str) -> dict:
    return _decode_token(token, "refresh")


def hash_refresh_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()