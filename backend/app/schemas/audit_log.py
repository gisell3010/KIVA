from app.schemas.common import Id, Schema, UTCDateTime


class AuditLogRead(Schema):
    id: Id
    user_id: Id | None
    action: str
    entity: str | None
    entity_id: Id | None
    created_at: UTCDateTime