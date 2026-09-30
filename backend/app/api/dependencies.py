from collections.abc import Callable
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Annotated

from fastapi import Depends, Header, Path, Query, Request, Response
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.exceptions import AppError
from app.core.permissions import (
    GlobalRole,
    require_global_role,
    require_group_role,
    require_trip_role,
)
from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.auth_session import AuthSession
from app.models.group import GroupMember
from app.models.trip import Trip, TripMember
from app.models.user import User
from app.schemas.common import PaginationParams, as_utc

bearer = HTTPBearer(auto_error=False, bearerFormat="JWT")

DbSession = Annotated[Session, Depends(get_db)]
PathId = Annotated[int, Path(gt=0, le=2_147_483_647)]


@dataclass(frozen=True)
class AuthContext:
    user: User
    session: AuthSession


def _authentication_error() -> AppError:
    return AppError(
        "Debes iniciar sesión nuevamente.",
        status_code=401,
        code="UNAUTHENTICATED",
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_auth_context(
    db: DbSession,
    credentials: Annotated[
        HTTPAuthorizationCredentials | None,
        Depends(bearer),
    ],
) -> AuthContext:
    if credentials is None:
        raise _authentication_error()

    claims = decode_access_token(credentials.credentials)
    user_id = int(claims["sub"])
    session_id = int(claims["sid"])

    if not (
        0 < user_id <= 2_147_483_647
        and 0 < session_id <= 2_147_483_647
    ):
        raise _authentication_error()

    result = db.execute(
        select(User, AuthSession)
        .join(AuthSession, AuthSession.user_id == User.id)
        .where(
            User.id == user_id,
            AuthSession.id == session_id,
        )
    ).one_or_none()

    if result is None:
        raise _authentication_error()

    user, auth_session = result

    if (
        auth_session.revoked_at is not None
        or as_utc(auth_session.expires_at) <= datetime.now(timezone.utc)
    ):
        raise _authentication_error()

    if user.status != "ACTIVE":
        raise AppError(
            "Tu cuenta no está activa.",
            status_code=403,
            code="ACCOUNT_INACTIVE",
        )

    return AuthContext(user=user, session=auth_session)


CurrentAuth = Annotated[AuthContext, Depends(get_auth_context)]


def get_current_user(auth: CurrentAuth) -> User:
    return auth.user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_roles(*roles: GlobalRole) -> Callable[..., User]:
    def dependency(user: CurrentUser) -> User:
        require_global_role(user.role, roles)
        return user

    return dependency


AdminUser = Annotated[
    User,
    Depends(require_roles("SUPER_ADMIN", "ADMIN")),
]

SupportUser = Annotated[
    User,
    Depends(require_roles("SUPER_ADMIN", "ADMIN", "SUPPORT")),
]

SuperAdminUser = Annotated[
    User,
    Depends(require_roles("SUPER_ADMIN")),
]


def get_group_member(
    group_id: PathId,
    db: DbSession,
    user: CurrentUser,
) -> GroupMember:
    member = db.scalar(
        select(GroupMember).where(
            GroupMember.group_id == group_id,
            GroupMember.user_id == user.id,
        )
    )

    if member is None:
        raise AppError(
            "Grupo no disponible.",
            status_code=404,
            code="GROUP_NOT_FOUND",
        )

    return member


GroupAccess = Annotated[GroupMember, Depends(get_group_member)]


def get_group_owner(member: GroupAccess) -> GroupMember:
    require_group_role(member.role, ("OWNER",))
    return member


GroupOwner = Annotated[GroupMember, Depends(get_group_owner)]


def get_trip_member(
    trip_id: PathId,
    db: DbSession,
    user: CurrentUser,
) -> TripMember:
    member = db.scalar(
        select(TripMember)
        .join(Trip, Trip.id == TripMember.trip_id)
        .join(
            GroupMember,
            (GroupMember.group_id == Trip.group_id)
            & (GroupMember.user_id == TripMember.user_id),
        )
        .where(
            TripMember.trip_id == trip_id,
            TripMember.user_id == user.id,
        )
    )

    if member is None:
        raise AppError(
            "Viaje no disponible.",
            status_code=404,
            code="TRIP_NOT_FOUND",
        )

    return member


TripAccess = Annotated[TripMember, Depends(get_trip_member)]


def get_trip_manager(member: TripAccess) -> TripMember:
    require_trip_role(member.role, ("OWNER", "ORGANIZER"))
    return member


def get_trip_owner(member: TripAccess) -> TripMember:
    require_trip_role(member.role, ("OWNER",))
    return member


TripManager = Annotated[TripMember, Depends(get_trip_manager)]
TripOwner = Annotated[TripMember, Depends(get_trip_owner)]


def get_pagination(
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
) -> PaginationParams:
    return PaginationParams(page=page, page_size=page_size)


Pagination = Annotated[PaginationParams, Depends(get_pagination)]


def require_browser_request(
    request: Request,
    x_kiva_csrf: Annotated[
        str | None, Header(alias="X-KIVA-CSRF")
    ] = None,
) -> None:
    if x_kiva_csrf != "1":
        raise AppError(
            "Falta el encabezado de protección de la solicitud.",
            403,
            "CSRF_HEADER_REQUIRED",
        )

    origin = request.headers.get("origin")
    own_origin = f"{request.url.scheme}://{request.url.netloc}"
    allowed = {*get_settings().CORS_ORIGINS, own_origin}

    if origin is not None and origin not in allowed:
        raise AppError(
            "El origen de la solicitud no está permitido.",
            403,
            "ORIGIN_NOT_ALLOWED",
        )


def clear_refresh_cookie(response: Response) -> None:
    settings = get_settings()

    response.delete_cookie(
        key=settings.refresh_cookie_name,
        path=settings.refresh_cookie_path,
        secure=settings.secure_cookies,
        httponly=True,
        samesite="lax",
    )

    response.headers["Cache-Control"] = "no-store"