from fastapi import APIRouter, Response

from app.api.dependencies import (
    CurrentUser,
    DbSession,
    Pagination,
    PathId,
)
from app.schemas.common import Page
from app.schemas.notification import (
    NotificationRead,
    NotificationUpdate,
    UnreadCount,
)
from app.services import notification_service

router = APIRouter(
    prefix="/notifications",
    tags=["Notificaciones"],
)


@router.get("", response_model=Page[NotificationRead])
def list_notifications(
    db: DbSession,
    user: CurrentUser,
    pagination: Pagination,
    is_read: bool | None = None,
):
    return notification_service.list_notifications(
        db,
        user_id=user.id,
        pagination=pagination,
        is_read=is_read,
    )


@router.get("/unread-count", response_model=UnreadCount)
def unread_count(db: DbSession, user: CurrentUser):
    return notification_service.unread_count(
        db,
        user_id=user.id,
    )


@router.post("/read-all", status_code=204)
def mark_all_read(db: DbSession, user: CurrentUser):
    notification_service.mark_all_read(
        db,
        user_id=user.id,
    )

    return Response(status_code=204)


@router.patch(
    "/{notification_id}",
    response_model=NotificationRead,
)
def update_notification(
    notification_id: PathId,
    data: NotificationUpdate,
    db: DbSession,
    user: CurrentUser,
):
    return notification_service.update_notification(
        db,
        user_id=user.id,
        notification_id=notification_id,
        data=data,
    )


@router.delete("/{notification_id}", status_code=204)
def delete_notification(
    notification_id: PathId,
    db: DbSession,
    user: CurrentUser,
):
    notification_service.delete_notification(
        db,
        user_id=user.id,
        notification_id=notification_id,
    )

    return Response(status_code=204)