from typing import Annotated, Literal

from pydantic import Field

from app.schemas.common import Schema, TotalAmount
from app.schemas.trip import TripStatus
from app.schemas.user import GlobalRole

Count = Annotated[int, Field(ge=0)]


class DashboardRead(Schema):
    groups_count: Count
    trips_count: Count
    participants_count: Count
    upcoming_activities_count: Count
    unread_notifications_count: Count
    open_polls_count: Count
    total_expenses: TotalAmount
    currency: Literal["COP"] = "COP"


class AdminDashboardRead(Schema):
    users_count: Count
    active_users_count: Count
    suspended_users_count: Count
    groups_count: Count
    trips_count: Count
    active_trips_count: Count
    expenses_count: Count
    reservations_count: Count
    polls_count: Count
    open_polls_count: Count
    total_expenses: TotalAmount
    users_by_role: dict[GlobalRole, Count]
    trips_by_status: dict[TripStatus, Count]
    currency: Literal["COP"] = "COP"