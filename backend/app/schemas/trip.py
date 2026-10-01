from datetime import date
from typing import Annotated, Literal

from pydantic import Field, model_validator

from app.schemas.common import (
    Description,
    Id,
    NonEmptyText,
    PatchSchema,
    Schema,
    UTCDateTime,
)

TripStatus = Literal[
    "PLANNING",
    "CONFIRMED",
    "COMPLETED",
    "CANCELLED",
]

TripRole = Literal["OWNER", "ORGANIZER", "MEMBER"]
AssignableTripRole = Literal["ORGANIZER", "MEMBER"]
TripName = Annotated[NonEmptyText, Field(max_length=150)]


def validate_dates(
    start_date: date | None,
    end_date: date | None,
) -> None:
    if end_date is not None and (
        start_date is None or end_date < start_date
    ):
        raise ValueError(
            "La fecha final requiere una fecha inicial anterior o igual."
        )


class TripCreate(Schema):
    group_id: Id
    name: TripName
    description: Description | None = None
    start_date: date | None = None
    end_date: date | None = None

    @model_validator(mode="after")
    def validate_period(self):
        validate_dates(self.start_date, self.end_date)
        return self


class TripUpdate(PatchSchema):
    nullable_fields = frozenset({
        "description",
        "start_date",
        "end_date",
    })

    name: TripName | None = None
    description: Description | None = None
    start_date: date | None = None
    end_date: date | None = None
    status: TripStatus | None = None

    @model_validator(mode="after")
    def validate_period(self):
        if {"start_date", "end_date"} <= self.model_fields_set:
            validate_dates(self.start_date, self.end_date)
        return self


class TripRead(Schema):
    id: Id
    group_id: Id
    name: str
    description: str | None
    start_date: date | None
    end_date: date | None
    status: TripStatus
    created_at: UTCDateTime
    group_name: str
    my_role: TripRole | None
    members_count: int = Field(ge=0)
    destinations_count: int = Field(ge=0)
    selected_destinations_count: int = Field(ge=0)


class TripMemberAdd(Schema):
    user_id: Id
    role: AssignableTripRole = "MEMBER"


class TripMemberUpdate(Schema):
    role: AssignableTripRole


class TripMemberRead(Schema):
    id: Id
    trip_id: Id
    user_id: Id
    role: TripRole
    full_name: str
    username: str
    profile_image: str | None