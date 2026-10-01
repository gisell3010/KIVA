from typing import Literal

from pydantic import Field

from app.schemas.common import Schema


class SupportDashboardRead(Schema):
    users_count: int = Field(ge=0)
    active_users_count: int = Field(ge=0)
    suspended_users_count: int = Field(ge=0)


class SystemConfigRead(Schema):
    app_name: str
    environment: Literal["development", "test", "production"]
    api_prefix: str
    currency: Literal["COP"] = "COP"
    access_token_minutes: int
    refresh_token_days: int
    max_image_bytes: int
    max_destination_photos: int