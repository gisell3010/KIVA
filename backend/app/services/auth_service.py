import secrets
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from hmac import compare_digest

from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.exceptions import AppError
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    hash_password,
    hash_refresh_token,
    verify_password,
)
from app.models.auth_session import AuthSession
from app.models.user import User
from app.schemas.auth import (
    AuthResponse,
    AuthSessionRead,
    LoginRequest,
    RegisterRequest,
)
from app.schemas.common import as_utc
from app.schemas.user import UserRead
from app.services.audit_service import record_action


@dataclass(frozen=True, repr=False)
class AuthResult:
    response: AuthResponse
    refresh_token: str
    refresh_expires_at: datetime


def _invalid_session() -> AppError:
    return AppError(
        "La sesión no es válida o ha expirado.",
        401,
        "INVALID_SESSION",
        headers={"WWW-Authenticate": "Bearer"},
    )


def _lock_user(db: Session, user_id: int) -> User:
    user = db.scalar(
        select(User)
        .where(User.id == user_id)
        .with_for_update()
        .execution_options(populate_existing=True)
    )

    if user is None:
        raise _invalid_session()

    if user.status != "ACTIVE":
        raise AppError(
            "Tu cuenta no está activa.",
            403,
            "ACCOUNT_INACTIVE",
        )

    return user


def _tokens(user: User, session: AuthSession) -> AuthResult:
    expires_at = as_utc(session.expires_at)

    refresh_token = create_refresh_token(
        user.id,
        session.id,
        expires_at,
    )

    session.refresh_token_hash = hash_refresh_token(refresh_token)

    return AuthResult(
        response=AuthResponse(
            access_token=create_access_token(user.id, session.id),
            expires_in=get_settings().ACCESS_TOKEN_MINUTES * 60,
            user=UserRead.model_validate(user),
        ),
        refresh_token=refresh_token,
        refresh_expires_at=expires_at,
    )


def _new_session(db: Session, user: User) -> AuthResult:
    session = AuthSession(
        user_id=user.id,
        refresh_token_hash=hash_refresh_token(
            secrets.token_urlsafe(48)
        ),
        expires_at=datetime.now(timezone.utc) + timedelta(
            days=get_settings().REFRESH_TOKEN_DAYS
        ),
    )

    db.add(session)
    db.flush()

    return _tokens(user, session)


def register(db: Session, data: RegisterRequest) -> AuthResult:
    try:
        existing = db.scalar(select(User.id).where(
            (User.username == data.username) | (User.email == str(data.email))
        ).limit(1))
        if existing is not None:
            raise AppError("El correo o el nombre de usuario ya está registrado.", 409, "USER_ALREADY_EXISTS")

        user = User(
            full_name=data.full_name,
            username=data.username,
            email=str(data.email),
            password_hash=hash_password(
                data.password.get_secret_value()
            ),
            role="USER",
            status="ACTIVE",
        )

        db.add(user)
        db.flush()

        result = _new_session(db, user)

        record_action(
            db,
            user_id=user.id,
            action="USER_REGISTER",
            entity="auth.users",
            entity_id=user.id,
        )

        db.commit()
        return result

    except IntegrityError as exc:
        db.rollback()

        constraint = getattr(
            getattr(exc.orig, "diag", None),
            "constraint_name",
            None,
        )

        if constraint in {
            "users_username_key",
            "users_email_key",
        }:
            raise AppError(
                "El correo o el nombre de usuario ya está registrado.",
                409,
                "USER_ALREADY_EXISTS",
            ) from None

        raise

    except Exception:
        db.rollback()
        raise


def login(db: Session, data: LoginRequest) -> AuthResult:
    try:
        user = db.scalar(
            select(User)
            .where(User.email == str(data.email))
            .with_for_update()
            .execution_options(populate_existing=True)
        )

        valid = verify_password(
            data.password.get_secret_value(),
            user.password_hash if user is not None else None,
        )

        if not valid or user is None:
            raise AppError(
                "Correo o contraseña incorrectos.",
                401,
                "INVALID_CREDENTIALS",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if user.status != "ACTIVE":
            raise AppError(
                "Tu cuenta no está activa.",
                403,
                "ACCOUNT_INACTIVE",
            )

        result = _new_session(db, user)

        record_action(
            db,
            user_id=user.id,
            action="AUTH_LOGIN",
            entity="auth.users",
            entity_id=user.id,
        )

        db.commit()
        return result

    except Exception:
        db.rollback()
        raise


def refresh(db: Session, refresh_token: str) -> AuthResult:
    try:
        claims = decode_refresh_token(refresh_token)
        user = _lock_user(db, int(claims["sub"]))

        session = db.scalar(
            select(AuthSession)
            .where(
                AuthSession.id == int(claims["sid"]),
                AuthSession.user_id == user.id,
            )
            .with_for_update()
            .execution_options(populate_existing=True)
        )

        now = datetime.now(timezone.utc)

        if (
            session is None
            or session.revoked_at is not None
            or as_utc(session.expires_at) <= now
        ):
            raise _invalid_session()

        if not compare_digest(
            session.refresh_token_hash,
            hash_refresh_token(refresh_token),
        ):
            session.revoked_at = now

            record_action(
                db,
                user_id=user.id,
                action="AUTH_REFRESH_REUSE",
                entity="auth.auth_sessions",
                entity_id=session.id,
            )

            db.commit()
            raise _invalid_session()

        result = _tokens(user, session)

        db.commit()
        return result

    except Exception:
        db.rollback()
        raise


def list_sessions(
    db: Session,
    *,
    user_id: int,
) -> list[AuthSessionRead]:
    user = db.scalar(
        select(User)
        .where(User.id == user_id)
        .execution_options(populate_existing=True)
    )

    if user is None or user.status != "ACTIVE":
        raise _invalid_session()

    sessions = db.scalars(
        select(AuthSession)
        .where(
            AuthSession.user_id == user.id,
            AuthSession.revoked_at.is_(None),
            AuthSession.expires_at > datetime.now(timezone.utc),
        )
        .order_by(
            AuthSession.created_at.desc(),
            AuthSession.id.desc(),
        )
    ).all()

    return [
        AuthSessionRead.model_validate(session)
        for session in sessions
    ]


def revoke_session(
    db: Session,
    *,
    user_id: int,
    session_id: int,
) -> None:
    try:
        user = _lock_user(db, user_id)

        session = db.scalar(
            select(AuthSession)
            .where(
                AuthSession.id == session_id,
                AuthSession.user_id == user.id,
            )
            .with_for_update()
            .execution_options(populate_existing=True)
        )

        if session is None:
            raise AppError(
                "Sesión no disponible.",
                404,
                "SESSION_NOT_FOUND",
            )

        if session.revoked_at is None:
            session.revoked_at = datetime.now(timezone.utc)

            record_action(
                db,
                user_id=user.id,
                action="AUTH_SESSION_REVOKE",
                entity="auth.auth_sessions",
                entity_id=session.id,
            )

        db.commit()

    except Exception:
        db.rollback()
        raise


def invalidate_user_sessions(
    db: Session,
    *,
    user_id: int,
) -> None:
    db.execute(
        update(AuthSession)
        .where(
            AuthSession.user_id == user_id,
            AuthSession.revoked_at.is_(None),
        )
        .values(revoked_at=datetime.now(timezone.utc))
        .execution_options(synchronize_session=False)
    )


def logout_all(db: Session, *, user_id: int) -> None:
    try:
        user = _lock_user(db, user_id)

        invalidate_user_sessions(db, user_id=user.id)

        record_action(
            db,
            user_id=user.id,
            action="AUTH_LOGOUT_ALL",
            entity="auth.users",
            entity_id=user.id,
        )

        db.commit()

    except Exception:
        db.rollback()
        raise