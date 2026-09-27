from typing import Literal

from pydantic import Field

from app.schemas.common import Schema, TotalAmount


class DashboardRead(Schema):
    groups_count: int = Field(ge=0)
    trips_count: int = Field(ge=0)
    upcoming_activities_count: int = Field(ge=0)
    unread_notifications_count: int = Field(ge=0)


class AdminDashboardRead(Schema):
    users_count: int = Field(ge=0)
    active_users_count: int = Field(ge=0)
    groups_count: int = Field(ge=0)
    trips_count: int = Field(ge=0)
    total_expenses: TotalAmount
    currency: Literal["COP"] = "COP"