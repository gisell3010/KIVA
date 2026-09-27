from datetime import date
from typing import Annotated, Literal

from pydantic import Field

from app.schemas.common import (
    CatalogRead,
    Id,
    Money,
    NonEmptyText,
    PatchSchema,
    Schema,
)

ReservationStatus = Literal["PENDING", "CONFIRMED", "CANCELLED"]
ReservationTitle = Annotated[NonEmptyText, Field(max_length=150)]
Provider = Annotated[NonEmptyText, Field(max_length=150)]


class ReservationTypeRead(CatalogRead):
    pass


class ReservationCreate(Schema):
    type_id: Id
    title: ReservationTitle
    provider: Provider | None = None
    reservation_date: date | None = None
    amount: Money | None = None


class ReservationUpdate(PatchSchema):
    nullable_fields = frozenset({
        "provider", "reservation_date", "amount"
    })

    type_id: Id | None = None
    title: ReservationTitle | None = None
    provider: Provider | None = None
    reservation_date: date | None = None
    amount: Money | None = None
    status: ReservationStatus | None = None


class ReservationRead(Schema):
    id: Id
    trip_id: Id
    type_id: Id
    title: str
    provider: str | None
    reservation_date: date | None
    amount: Money | None
    status: ReservationStatus