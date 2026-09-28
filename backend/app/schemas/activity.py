from datetime import date
from typing import Annotated, Literal

from pydantic import Field

from app.schemas.common import (
    Description,
    Id,
    LocalTime,
    Money,
    NonEmptyText,
    PatchSchema,
    Schema,
)

ActivityStatus = Literal["PROPOSED", "APPROVED", "CANCELLED"]
ActivityTitle = Annotated[NonEmptyText, Field(max_length=150)]
Location = Annotated[NonEmptyText, Field(max_length=150)]


class ActivityCreate(Schema):
    title: ActivityTitle
    description: Description | None = None
    location: Location | None = None
    activity_date: date
    start_time: LocalTime | None = None
    estimated_cost: Money | None = None


class ActivityUpdate(PatchSchema):
    nullable_fields = frozenset({
        "description", "location", "start_time", "estimated_cost"
    })

    title: ActivityTitle | None = None
    description: Description | None = None
    location: Location | None = None
    activity_date: date | None = None
    start_time: LocalTime | None = None
    estimated_cost: Money | None = None
    status: ActivityStatus | None = None


class ActivityRead(Schema):
    id: Id
    trip_id: Id
    title: str
    description: str | None
    location: str | None
    activity_date: date
    start_time: LocalTime | None
    estimated_cost: Money | None
    status: ActivityStatus