from typing import Annotated

from fastapi import APIRouter, File, Response, UploadFile
from fastapi.responses import FileResponse

from app.api.dependencies import (
    CurrentUser,
    DbSession,
    Pagination,
    PathId,
)
from app.schemas.common import Page
from app.schemas.destination import (
    DestinationCreate,
    DestinationRead,
    DestinationSelection,
    DestinationUpdate,
)
from app.schemas.destination_photo import (
    DestinationPhotoRead,
    DestinationPhotoReorder,
)
from app.services import (
    destination_photo_service,
    destination_service,
)

router = APIRouter(
    prefix="/trips/{trip_id}/destinations",
    tags=["Destinos"],
)


@router.get("", response_model=Page[DestinationRead])
def list_destinations(
    trip_id: PathId,
    db: DbSession,
    user: CurrentUser,
    pagination: Pagination,
):
    return destination_service.list_destinations(
        db,
        actor_id=user.id,
        trip_id=trip_id,
        pagination=pagination,
    )


@router.post(
    "",
    response_model=DestinationRead,
    status_code=201,
)
def create_destination(
    trip_id: PathId,
    data: DestinationCreate,
    db: DbSession,
    user: CurrentUser,
):
    return destination_service.create_destination(
        db,
        actor_id=user.id,
        trip_id=trip_id,
        data=data,
    )


@router.get(
    "/{destination_id}",
    response_model=DestinationRead,
)
def get_destination(
    trip_id: PathId,
    destination_id: PathId,
    db: DbSession,
    user: CurrentUser,
):
    return destination_service.get_destination(
        db,
        actor_id=user.id,
        trip_id=trip_id,
        destination_id=destination_id,
    )


@router.patch(
    "/{destination_id}",
    response_model=DestinationRead,
)
def update_destination(
    trip_id: PathId,
    destination_id: PathId,
    data: DestinationUpdate,
    db: DbSession,
    user: CurrentUser,
):
    return destination_service.update_destination(
        db,
        actor_id=user.id,
        trip_id=trip_id,
        destination_id=destination_id,
        data=data,
    )


@router.delete("/{destination_id}", status_code=204)
def delete_destination(
    trip_id: PathId,
    destination_id: PathId,
    db: DbSession,
    user: CurrentUser,
):
    destination_service.delete_destination(
        db,
        actor_id=user.id,
        trip_id=trip_id,
        destination_id=destination_id,
    )

    return Response(status_code=204)


@router.put(
    "/{destination_id}/selection",
    response_model=DestinationRead,
)
def select_destination(
    trip_id: PathId,
    destination_id: PathId,
    data: DestinationSelection,
    db: DbSession,
    user: CurrentUser,
):
    return destination_service.select_destination(
        db,
        actor_id=user.id,
        trip_id=trip_id,
        destination_id=destination_id,
        data=data,
    )


@router.get(
    "/{destination_id}/photos",
    response_model=list[DestinationPhotoRead],
)
def list_photos(
    trip_id: PathId,
    destination_id: PathId,
    db: DbSession,
    user: CurrentUser,
):
    return destination_photo_service.list_photos(
        db,
        actor_id=user.id,
        trip_id=trip_id,
        destination_id=destination_id,
    )


@router.post(
    "/{destination_id}/photos",
    response_model=DestinationPhotoRead,
    status_code=201,
)
def upload_photo(
    trip_id: PathId,
    destination_id: PathId,
    db: DbSession,
    user: CurrentUser,
    file: Annotated[UploadFile, File()],
):
    return destination_photo_service.upload_photo(
        db,
        actor_id=user.id,
        trip_id=trip_id,
        destination_id=destination_id,
        stream=file.file,
    )


@router.put(
    "/{destination_id}/photos/order",
    response_model=list[DestinationPhotoRead],
)
def reorder_photos(
    trip_id: PathId,
    destination_id: PathId,
    data: DestinationPhotoReorder,
    db: DbSession,
    user: CurrentUser,
):
    return destination_photo_service.reorder_photos(
        db,
        actor_id=user.id,
        trip_id=trip_id,
        destination_id=destination_id,
        data=data,
    )


@router.get(
    "/{destination_id}/photos/{photo_id}/file",
    response_class=FileResponse,
    responses={200: {"content": {"image/jpeg": {}}}},
)
def get_photo_file(
    trip_id: PathId,
    destination_id: PathId,
    photo_id: PathId,
    db: DbSession,
    user: CurrentUser,
):
    path = destination_photo_service.get_photo_file(
        db,
        actor_id=user.id,
        trip_id=trip_id,
        destination_id=destination_id,
        photo_id=photo_id,
    )

    return FileResponse(
        path,
        media_type="image/jpeg",
        headers={"Cache-Control": "no-store"},
    )


@router.delete(
    "/{destination_id}/photos/{photo_id}",
    status_code=204,
)
def delete_photo(
    trip_id: PathId,
    destination_id: PathId,
    photo_id: PathId,
    db: DbSession,
    user: CurrentUser,
):
    destination_photo_service.delete_photo(
        db,
        actor_id=user.id,
        trip_id=trip_id,
        destination_id=destination_id,
        photo_id=photo_id,
    )

    return Response(status_code=204)