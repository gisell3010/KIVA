from pydantic import Field, field_validator

from app.schemas.common import (
    Id,
    Schema,
    UTCDateTime,
    validate_unique_ids,
)


class DestinationPhotoRead(Schema):
    id: Id
    destination_id: Id
    uploaded_by_user_id: Id
    image_url: str
    position: int = Field(gt=0)
    created_at: UTCDateTime


class DestinationPhotoReorder(Schema):
    photo_ids: list[Id] = Field(min_length=1)

    @field_validator("photo_ids")
    @classmethod
    def validate_photo_ids(cls, values):
        return validate_unique_ids(values)