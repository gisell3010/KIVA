from typing import Annotated, Literal

from pydantic import Field

from app.schemas.common import (
    Email,
    Id,
    NonEmptyText,
    PatchSchema,
    Schema,
    UTCDateTime,
    Username,
)

GlobalRole = Literal["SUPER_ADMIN", "ADMIN", "SUPPORT", "USER"]
UserStatus = Literal["ACTIVE", "SUSPENDED"]


class UserPublic(Schema):
    id: Id
    full_name: str
    username: str
    profile_image: str | None


class UserRead(UserPublic):
    email: Email
    role: GlobalRole
    status: UserStatus
    created_at: UTCDateTime


class UserUpdate(PatchSchema):
    full_name: Annotated[
        NonEmptyText, Field(max_length=120)
    ] | None = None
    username: Username | None = None


class UserAdminUpdate(PatchSchema):
    role: GlobalRole | None = None
    status: UserStatus | None = None