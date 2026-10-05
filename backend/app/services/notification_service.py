from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.core.exceptions import AppError
from app.models.notification import Notification
from app.models.trip import TripMember
from app.models.user import User
from app.schemas.common import Page, PaginationParams
from app.schemas.notification import (
    NotificationRead,
    NotificationUpdate,
    UnreadCount,
)


def _require_user(
    db: Session,
    user_id: int,
    *,
    lock: bool = False,
) -> None:
    statement = select(User).where(User.id == user_id)

    if lock:
        statement = statement.with_for_update()

    user = db.scalar(
        statement.execution_options(populate_existing=True)
    )

    if user is None or user.status != "ACTIVE":
        raise AppError(
            "Cuenta no disponible.",
            403,
            "ACCOUNT_INACTIVE",
        )


def create_notification(
    db: Session,
    *,
    user_id: int,
    title: str,
    message: str,
) -> Notification:
    title, message = title.strip(), message.strip()

    if (
        not title
        or len(title) > 150
        or not message
        or len(message) > 300
    ):
        raise ValueError("Contenido de notificación inválido.")

    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        is_read=False,
    )

    db.add(notification)
    return notification


def notify_trip_members(
    db: Session,
    *,
    trip_id: int,
    title: str,
    message: str,
    exclude_user_id: int | None = None,
) -> None:
    """Crea una notificación para los participantes activos de un viaje.

    Se usa para acontecimientos colaborativos que todos los participantes del
    viaje deben conocer. El usuario que origina el cambio puede excluirse para
    evitar notificaciones redundantes sobre su propia acción.
    """
    statement = (
        select(TripMember.user_id)
        .join(User, User.id == TripMember.user_id)
        .where(
            TripMember.trip_id == trip_id,
            User.status == "ACTIVE",
        )
    )

    if exclude_user_id is not None:
        statement = statement.where(
            TripMember.user_id != exclude_user_id
        )

    for user_id in db.scalars(statement).all():
        create_notification(
            db,
            user_id=user_id,
            title=title,
            message=message,
        )


def list_notifications(
    db: Session,
    *,
    user_id: int,
    pagination: PaginationParams,
    is_read: bool | None = None,
) -> Page[NotificationRead]:
    _require_user(db, user_id)

    conditions = [Notification.user_id == user_id]

    if is_read is not None:
        conditions.append(Notification.is_read == is_read)

    total = db.scalar(
        select(func.count())
        .select_from(Notification)
        .where(*conditions)
    ) or 0

    notifications = db.scalars(
        select(Notification)
        .where(*conditions)
        .order_by(
            Notification.created_at.desc(),
            Notification.id.desc(),
        )
        .offset((pagination.page - 1) * pagination.page_size)
        .limit(pagination.page_size)
    ).all()

    return Page[NotificationRead](
        items=[
            NotificationRead.model_validate(item)
            for item in notifications
        ],
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
    )


def unread_count(db: Session, *, user_id: int) -> UnreadCount:
    _require_user(db, user_id)

    total = db.scalar(
        select(func.count())
        .select_from(Notification)
        .where(
            Notification.user_id == user_id,
            Notification.is_read.is_(False),
        )
    ) or 0

    return UnreadCount(total=total)


def _get_notification(
    db: Session,
    user_id: int,
    notification_id: int,
) -> Notification:
    notification = db.scalar(
        select(Notification)
        .where(
            Notification.id == notification_id,
            Notification.user_id == user_id,
        )
        .with_for_update()
        .execution_options(populate_existing=True)
    )

    if notification is None:
        raise AppError(
            "Notificación no disponible.",
            404,
            "NOTIFICATION_NOT_FOUND",
        )

    return notification


def update_notification(
    db: Session,
    *,
    user_id: int,
    notification_id: int,
    data: NotificationUpdate,
) -> NotificationRead:
    try:
        _require_user(db, user_id, lock=True)

        notification = _get_notification(
            db,
            user_id,
            notification_id,
        )
        notification.is_read = data.is_read

        result = NotificationRead.model_validate(notification)

        db.commit()
        return result

    except Exception:
        db.rollback()
        raise


def mark_all_read(db: Session, *, user_id: int) -> None:
    try:
        _require_user(db, user_id, lock=True)

        db.execute(
            update(Notification)
            .where(
                Notification.user_id == user_id,
                Notification.is_read.is_(False),
            )
            .values(is_read=True)
            .execution_options(synchronize_session=False)
        )

        db.commit()

    except Exception:
        db.rollback()
        raise


def delete_notification(
    db: Session,
    *,
    user_id: int,
    notification_id: int,
) -> None:
    try:
        _require_user(db, user_id, lock=True)

        notification = _get_notification(
            db,
            user_id,
            notification_id,
        )

        db.delete(notification)
        db.commit()

    except Exception:
        db.rollback()
        raise
