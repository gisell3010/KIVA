from pydantic import Field, StrictBool

from app.schemas.common import Id, Schema, UTCDateTime


class NotificationRead(Schema):
    id: Id
    user_id: Id
    title: str
    message: str
    is_read: bool
    created_at: UTCDateTime


class NotificationUpdate(Schema):
    is_read: StrictBool


class UnreadCount(Schema):
    total: int = Field(ge=0)