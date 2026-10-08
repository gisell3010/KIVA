from sqlalchemy import func, select

from app.core.config import get_settings
from app.models.group import TravelGroup
from app.models.trip import Trip
from app.models.user import User
from app.schemas.admin import SystemConfigRead
from app.schemas.group import GroupRead
from app.schemas.trip import TripRead
from app.services import (
    group_service,
    trip_service,
    user_service,
)
from app.services._shared import (
    active_user,
    allow,
    mapped_page,
)

STAFF = {"SUPER_ADMIN", "ADMIN", "SUPPORT"}
ADMINS = {"SUPER_ADMIN", "ADMIN"}


def _authorize(db, actor_id, roles):
    actor = active_user(db, actor_id)
    allow(actor.role, roles)


def list_users(
    db,
    *,
    actor_id,
    pagination,
    q=None,
    role=None,
    status=None,
):
    return user_service.list_users(
        db,
        actor_id=actor_id,
        pagination=pagination,
        q=q,
        role=role,
        status=status,
    )


def get_user(db, *, actor_id, user_id):
    return user_service.get_user(
        db,
        actor_id=actor_id,
        user_id=user_id,
    )


def list_groups(db, *, actor_id, pagination, q=None):
    _authorize(db, actor_id, ADMINS)

    statement = group_service.group_query(
        actor_id,
        all_trips=True,
    )

    if q and q.strip():
        statement = statement.where(
            func.lower(TravelGroup.name).contains(
                q.strip().lower(),
                autoescape=True,
            )
        )

    return mapped_page(
        db,
        statement.order_by(
            TravelGroup.created_at.desc(),
            TravelGroup.id.desc(),
        ),
        pagination,
        GroupRead,
    )


def list_trips(
    db,
    *,
    actor_id,
    pagination,
    q=None,
    status=None,
    group_id=None,
):
    _authorize(db, actor_id, ADMINS)

    statement = trip_service.trip_query(actor_id)

    if q and q.strip():
        statement = statement.where(
            func.lower(Trip.name).contains(
                q.strip().lower(),
                autoescape=True,
            )
        )

    if status is not None:
        statement = statement.where(
            Trip.status == status
        )

    if group_id is not None:
        statement = statement.where(
            Trip.group_id == group_id
        )

    return mapped_page(
        db,
        statement.order_by(
            Trip.created_at.desc(),
            Trip.id.desc(),
        ),
        pagination,
        TripRead,
    )


def get_system_config(db, *, actor_id):
    _authorize(db, actor_id, {"SUPER_ADMIN"})
    settings = get_settings()

    return SystemConfigRead(
        app_name=settings.APP_NAME,
        environment=settings.APP_ENV,
        api_prefix=settings.API_PREFIX,
        access_token_minutes=settings.ACCESS_TOKEN_MINUTES,
        refresh_token_days=settings.REFRESH_TOKEN_DAYS,
        max_image_bytes=settings.MAX_IMAGE_BYTES,
        max_destination_photos=settings.MAX_DESTINATION_PHOTOS,
    )