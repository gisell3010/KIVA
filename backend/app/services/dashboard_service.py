from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import func, or_, select

from app.models.activity import Activity
from app.models.expense import Expense
from app.models.group import GroupMember, TravelGroup
from app.models.notification import Notification
from app.models.poll import Poll
from app.models.reservation import Reservation
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

ACTIVE_TRIP_STATUSES = ("PLANNING", "CONFIRMED")


def _open_polls(now):
    return (
        select(func.count(Poll.id))
        .join(Trip, Trip.id == Poll.trip_id)
        .where(
            Poll.status == "OPEN",
            Trip.status.in_(ACTIVE_TRIP_STATUSES),
            or_(
                Poll.closes_at.is_(None),
                Poll.closes_at > now,
            ),
        )
    )


def get_dashboard(db, *, actor_id, today=None):
    active_user(db, actor_id)

    now = datetime.now(timezone.utc)
    today = today or now.date()

    trip_ids = visible_trips(actor_id)

    group_ids = select(GroupMember.group_id).where(
        GroupMember.user_id == actor_id
    )

    return DashboardRead(
        groups_count=db.scalar(
            select(func.count(GroupMember.id))
            .where(GroupMember.user_id == actor_id)
        ),
        trips_count=db.scalar(
            select(func.count(Trip.id))
            .where(Trip.id.in_(trip_ids))
        ),
        participants_count=db.scalar(
            select(
                func.count(
                    func.distinct(GroupMember.user_id)
                )
            )
            .where(GroupMember.group_id.in_(group_ids))
        ),
        upcoming_activities_count=db.scalar(
            select(func.count(Activity.id))
            .join(Trip, Trip.id == Activity.trip_id)
            .where(
                Activity.trip_id.in_(trip_ids),
                Activity.activity_date >= today,
                Activity.status != "CANCELLED",
                Trip.status.in_(ACTIVE_TRIP_STATUSES),
            )
        ),
        unread_notifications_count=db.scalar(
            select(func.count(Notification.id))
            .where(
                Notification.user_id == actor_id,
                Notification.is_read.is_(False),
            )
        ),
        open_polls_count=db.scalar(
            _open_polls(now)
            .where(Poll.trip_id.in_(trip_ids))
        ),
        total_expenses=(
            db.scalar(
                select(func.sum(Expense.amount))
                .where(Expense.trip_id.in_(trip_ids))
            )
            or Decimal("0.00")
        ),
    )


def get_admin_dashboard(db, *, actor_id):
    actor = active_user(db, actor_id)
    allow(actor.role, {"SUPER_ADMIN", "ADMIN"})

    now = datetime.now(timezone.utc)

    users_by_role = {
        role: 0
        for role in (
            "SUPER_ADMIN",
            "ADMIN",
            "SUPPORT",
            "USER",
        )
    }

    users_by_status = {
        "ACTIVE": 0,
        "SUSPENDED": 0,
    }

    for role, status, count in db.execute(
        select(
            User.role,
            User.status,
            func.count(User.id),
        )
        .group_by(User.role, User.status)
    ):
        users_by_role[role] += count
        users_by_status[status] += count

    trips_by_status = {
        status: 0
        for status in (
            "PLANNING",
            "CONFIRMED",
            "COMPLETED",
            "CANCELLED",
        )
    }

    for status, count in db.execute(
        select(
            Trip.status,
            func.count(Trip.id),
        )
        .group_by(Trip.status)
    ):
        trips_by_status[status] = count

    expenses_count, total_expenses = db.execute(
        select(
            func.count(Expense.id),
            func.sum(Expense.amount),
        )
    ).one()

    return AdminDashboardRead(
        users_count=sum(users_by_role.values()),
        active_users_count=users_by_status["ACTIVE"],
        suspended_users_count=users_by_status["SUSPENDED"],
        groups_count=db.scalar(
            select(func.count(TravelGroup.id))
        ),
        trips_count=sum(trips_by_status.values()),
        active_trips_count=sum(
            trips_by_status[status]
            for status in ACTIVE_TRIP_STATUSES
        ),
        expenses_count=expenses_count,
        reservations_count=db.scalar(
            select(func.count(Reservation.id))
        ),
        polls_count=db.scalar(
            select(func.count(Poll.id))
        ),
        open_polls_count=db.scalar(
            _open_polls(now)
        ),
        total_expenses=(
            total_expenses or Decimal("0.00")
        ),
        users_by_role=users_by_role,
        trips_by_status=trips_by_status,
    )