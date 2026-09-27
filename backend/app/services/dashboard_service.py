from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import func, select

from app.models.activity import Activity
from app.models.expense import Expense
from app.models.group import GroupMember, TravelGroup
from app.models.notification import Notification
from app.models.trip import Trip
from app.models.user import User
from app.schemas.dashboard import (
    AdminDashboardRead,
    DashboardRead,
)
from app.services._shared import (
    active_user,
    allow,
    visible_trips,
)


def get_dashboard(db, *, actor_id, today=None):
    active_user(db, actor_id)

    today = today or datetime.now(timezone.utc).date()
    trip_ids = visible_trips(actor_id)

    return DashboardRead(
        groups_count=db.scalar(
            select(func.count())
            .select_from(GroupMember)
            .where(GroupMember.user_id == actor_id)
        ),
        trips_count=db.scalar(
            select(func.count())
            .select_from(Trip)
            .where(Trip.id.in_(trip_ids))
        ),
        upcoming_activities_count=db.scalar(
            select(func.count())
            .select_from(Activity)
            .join(Trip, Trip.id == Activity.trip_id)
            .where(
                Activity.trip_id.in_(trip_ids),
                Activity.activity_date >= today,
                Activity.status != "CANCELLED",
                Trip.status.in_(["PLANNING", "CONFIRMED"]),
            )
        ),
        unread_notifications_count=db.scalar(
            select(func.count())
            .select_from(Notification)
            .where(
                Notification.user_id == actor_id,
                Notification.is_read.is_(False),
            )
        ),
    )


def get_admin_dashboard(db, *, actor_id):
    actor = active_user(db, actor_id)
    allow(actor.role, {"SUPER_ADMIN", "ADMIN"})

    return AdminDashboardRead(
        users_count=db.scalar(
            select(func.count()).select_from(User)
        ),
        active_users_count=db.scalar(
            select(func.count())
            .select_from(User)
            .where(User.status == "ACTIVE")
        ),
        groups_count=db.scalar(
            select(func.count()).select_from(TravelGroup)
        ),
        trips_count=db.scalar(
            select(func.count()).select_from(Trip)
        ),
        total_expenses=(
            db.scalar(select(func.sum(Expense.amount)))
            or Decimal("0.00")
        ),
    )