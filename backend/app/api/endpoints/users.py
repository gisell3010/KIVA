from typing import Annotated
from fastapi import APIRouter, File, Query, Response, UploadFile
from pathlib import Path
from fastapi.responses import FileResponse
from app.api.dependencies import (CurrentUser, DbSession, Pagination, PathId, clear_refresh_cookie)
from app.schemas.auth import (EmailChangeRequest, PasswordChangeRequest)
from app.schemas.common import Page
from app.schemas.user import UserPublic, UserRead, UserUpdate
from app.services import user_service

router = APIRouter(prefix="/users", tags=["Usuarios"])

@router.get("/me", response_model=UserRead)
def get_me(db: DbSession, user: CurrentUser):
    return user_service.get_me(db, actor_id=user.id)

@router.patch("/me", response_model=UserRead)
def update_me(
    data: UserUpdate,
    db: DbSession,
    user: CurrentUser,
):
    return user_service.update_me(
        db,
        actor_id=user.id,
        data=data,
    )

@router.put("/me/password", status_code=204)
def change_password(
    data: PasswordChangeRequest,
    db: DbSession,
    user: CurrentUser,
):
    user_service.change_password(
        db,
        actor_id=user.id,
        data=data,
    )

    response = Response(status_code=204)
    clear_refresh_cookie(response)
    return response

@router.put("/me/email", response_model=UserRead)
def change_email(
    data: EmailChangeRequest,
    db: DbSession,
    user: CurrentUser,
    response: Response,
):
    result = user_service.change_email(
        db,
        actor_id=user.id,
        data=data,
    )
    clear_refresh_cookie(response)
    return result

@router.put("/me/profile-image", response_model=UserRead)
def upload_profile_image(
    db: DbSession,
    user: CurrentUser,
    file: Annotated[UploadFile, File()],
):
    return user_service.upload_profile_image(
        db,
        actor_id=user.id,
        stream=file.file,
    )

@router.delete("/me/profile-image", status_code=204)
def delete_profile_image(db: DbSession, user: CurrentUser):
    user_service.delete_profile_image(
        db,
        actor_id=user.id,
    )
    return Response(status_code=204)

@router.get("/search", response_model=Page[UserPublic])
def search_users(
    db: DbSession,
    user: CurrentUser,
    pagination: Pagination,
    username: Annotated[
        str,
        Query(min_length=3, max_length=50),
    ],
):
    return user_service.search_users(
        db,
        actor_id=user.id,
        username=username,
        pagination=pagination,
    )

@router.get(
    "/{user_id}/profile-image",
    response_class=FileResponse,
    responses={200: {"content": {"image/jpeg": {}}}},
)
def get_profile_image(
    user_id: PathId,
    db: DbSession,
    user: CurrentUser,
):
    image = user_service.get_profile_image(
        db,
        actor_id=user.id,
        user_id=user_id,
    )
    if isinstance(image, Path):
        return FileResponse(
            image,
            media_type="image/jpeg",
            headers={"Cache-Control": "no-store"},
        )
    return Response(
        content=image,
        media_type="image/jpeg",
        headers={"Cache-Control": "private, max-age=300"},
    )