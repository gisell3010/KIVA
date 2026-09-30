from typing import Annotated, Literal

from pydantic import Field

from app.schemas.common import (
    Description,
    Id,
    NonEmptyText,
    PatchSchema,
    Schema,
    UTCDateTime,
)

GroupRole = Literal["OWNER", "MEMBER"]
GroupName = Annotated[NonEmptyText, Field(max_length=120)]


class GroupCreate(Schema):
    name: GroupName
    description: Description | None = None


class GroupUpdate(PatchSchema):
    nullable_fields = frozenset({"description"})

    name: GroupName | None = None
    description: Description | None = None


class GroupRead(Schema):
    id: Id
    name: str
    description: str | None
    created_at: UTCDateTime
    my_role: GroupRole | None
    members_count: int = Field(ge=0)
    trips_count: int = Field(ge=0)


class GroupMemberAdd(Schema):
    user_id: Id


class GroupMemberRead(Schema):
    id: Id
    group_id: Id
    user_id: Id
    role: GroupRole
    joined_at: UTCDateTime
    full_name: str
    username: str
    profile_image: str | None