from typing import Annotated

from pydantic import Field, StrictBool

from app.schemas.common import (
    Description,
    Id,
    NonEmptyText,
    PatchSchema,
    Schema,
)

Country = Annotated[NonEmptyText, Field(max_length=100)]
PlaceName = Annotated[NonEmptyText, Field(max_length=150)]


class DestinationCreate(Schema):
    country: Country
    place_name: PlaceName
    description: Description | None = None


class DestinationUpdate(PatchSchema):
    nullable_fields = frozenset({"description"})

    country: Country | None = None
    place_name: PlaceName | None = None
    description: Description | None = None


class DestinationSelection(Schema):
    is_selected: StrictBool


class DestinationRead(Schema):
    id: Id
    trip_id: Id
    proposed_by_user_id: Id
    country: str
    place_name: str
    description: str | None
    is_selected: bool