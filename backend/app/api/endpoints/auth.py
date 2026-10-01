from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Request, Response
from fastapi.responses import JSONResponse

from app.api.dependencies import (
    CurrentAuth,
    DbSession,
    PathId,
    clear_refresh_cookie,
    require_browser_request,
)
from app.core.config import get_settings
from app.core.exceptions import AppError
from app.core.security import decode_refresh_token
from app.schemas.auth import (
    AuthResponse,
    AuthSessionRead,
    LoginRequest,
    RegisterRequest,
)
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["Autenticación"])
cookie_guard = [Depends(require_browser_request)]


def _set_session(
    response: Response,
    result: auth_service.AuthResult,
):
    settings = get_settings()

    max_age = max(
        0,
        int(
            (
                result.refresh_expires_at
                - datetime.now(timezone.utc)
            ).total_seconds()
        ),
    )

    response.set_cookie(
        key=settings.refresh_cookie_name,
        value=result.refresh_token,
        max_age=max_age,
        expires=result.refresh_expires_at,
        path=settings.refresh_cookie_path,
        secure=settings.secure_cookies,
        httponly=True,
        samesite="lax",
    )

    response.headers["Cache-Control"] = "no-store"
    return result.response


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=201,
    dependencies=cookie_guard,
)
def register(
    data: RegisterRequest,
    db: DbSession,
    response: Response,
):
    return _set_session(
        response,
        auth_service.register(db, data),
    )


@router.post(
    "/login",
    response_model=AuthResponse,
    dependencies=cookie_guard,
)
def login(
    data: LoginRequest,
    db: DbSession,
    response: Response,
):
    return _set_session(
        response,
        auth_service.login(db, data),
    )


@router.post(
    "/refresh",
    response_model=AuthResponse,
    dependencies=cookie_guard,
)
def refresh(
    request: Request,
    db: DbSession,
    response: Response,
):
    token = request.cookies.get(
        get_settings().refresh_cookie_name
    )

    try:
        if not token:
            raise AppError(
                "Debes iniciar sesión.",
                401,
                "INVALID_SESSION",
            )

        result = auth_service.refresh(db, token)

    except AppError as exc:
        error = JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": exc.code,
                    "message": exc.message,
                }
            },
            headers=exc.headers,
        )

        clear_refresh_cookie(error)
        return error

    return _set_session(response, result)


@router.post(
    "/logout",
    status_code=204,
    dependencies=cookie_guard,
)
def logout(request: Request, db: DbSession):
    token = request.cookies.get(
        get_settings().refresh_cookie_name
    )

    if token:
        try:
            claims = decode_refresh_token(token)

            auth_service.revoke_session(
                db,
                user_id=int(claims["sub"]),
                session_id=int(claims["sid"]),
            )

        except AppError as exc:
            if exc.status_code not in {401, 403, 404}:
                raise

    response = Response(status_code=204)
    clear_refresh_cookie(response)
    return response


@router.get(
    "/sessions",
    response_model=list[AuthSessionRead],
)
def list_sessions(db: DbSession, auth: CurrentAuth):
    return auth_service.list_sessions(
        db,
        user_id=auth.user.id,
    )


@router.delete(
    "/sessions/{session_id}",
    status_code=204,
)
def revoke_session(
    session_id: PathId,
    db: DbSession,
    auth: CurrentAuth,
):
    auth_service.revoke_session(
        db,
        user_id=auth.user.id,
        session_id=session_id,
    )

    response = Response(status_code=204)

    if session_id == auth.session.id:
        clear_refresh_cookie(response)

    return response


@router.post("/logout-all", status_code=204)
def logout_all(db: DbSession, auth: CurrentAuth):
    auth_service.logout_all(
        db,
        user_id=auth.user.id,
    )

    response = Response(status_code=204)
    clear_refresh_cookie(response)
    return response