from typing import Literal

from app.schemas.common import Schema


class HealthRead(Schema):
    status: Literal["ok", "error"]


class ReadinessRead(HealthRead):
    database: Literal["ok", "unavailable"]