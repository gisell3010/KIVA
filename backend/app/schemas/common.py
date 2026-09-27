from datetime import datetime, time, timezone
from decimal import Decimal
from typing import Annotated, ClassVar, Generic, TypeVar

from pydantic import (
    AfterValidator,
    BaseModel,
    BeforeValidator,
    ConfigDict,
    EmailStr,
    Field,
    SecretStr,
    StringConstraints,
    model_validator,
)


def normalize_account(value):
    return value.strip().lower() if isinstance(value, str) else value


def as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def local_time(value: time) -> time:
    if value.tzinfo is not None:
        raise ValueError(
            "La hora de la actividad no debe incluir zona horaria."
        )
    return value


Id = Annotated[int, Field(gt=0, le=2_147_483_647)]

NonEmptyText = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=1),
]

Description = Annotated[
    str,
    StringConstraints(strip_whitespace=True, max_length=300),
]

Username = Annotated[
    str,
    BeforeValidator(normalize_account),
    StringConstraints(
        min_length=3,
        max_length=50,
        pattern=r"^[a-z0-9_.]+$",
    ),
]

Email = Annotated[
    EmailStr,
    AfterValidator(str.lower),
    Field(max_length=150),
]

NewPassword = Annotated[
    SecretStr,
    Field(min_length=10, max_length=128),
]

Amount = Annotated[
    Decimal,
    Field(decimal_places=2, allow_inf_nan=False),
]

Money = Annotated[Amount, Field(ge=0, max_digits=12)]
PositiveMoney = Annotated[Money, Field(gt=0)]
TotalAmount = Annotated[Amount, Field(ge=0)]
UTCDateTime = Annotated[datetime, AfterValidator(as_utc)]
LocalTime = Annotated[time, AfterValidator(local_time)]


class Schema(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        extra="forbid",
        hide_input_in_errors=True,
    )


class PatchSchema(Schema):
    nullable_fields: ClassVar[frozenset[str]] = frozenset()

    @model_validator(mode="after")
    def validate_patch(self):
        if not self.model_fields_set:
            raise ValueError("Envía al menos un campo para actualizar.")

        for name in self.model_fields_set:
            if (
                getattr(self, name) is None
                and name not in self.nullable_fields
            ):
                raise ValueError(f"El campo {name} no admite null.")

        return self


class PaginationParams(Schema):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)


T = TypeVar("T")


class Page(Schema, Generic[T]):
    items: list[T]
    total: int = Field(ge=0)
    page: int = Field(ge=1)
    page_size: int = Field(ge=1, le=100)


class MessageResponse(Schema):
    message: str


class CatalogRead(Schema):
    id: Id
    name: str


class OwnershipTransfer(Schema):
    new_owner_user_id: Id


def validate_unique_ids(values: list[int]) -> list[int]:
    if len(values) != len(set(values)):
        raise ValueError("No se permiten identificadores repetidos.")
    return values