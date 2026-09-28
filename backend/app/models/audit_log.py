from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Identity, Index, Integer, String, text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"
    __table_args__ = (
        Index("idx_audit_logs_entity", "entity", "entity_id"),
        Index(
            "idx_audit_logs_user_date",
            "user_id",
            text("created_at DESC"),
        ),
        {"schema": "audit"},
    )

    id: Mapped[int] = mapped_column(Integer, Identity(always=True), primary_key=True)
    user_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey(
            "auth.users.id",
            name="fk_audit_logs_user",
            ondelete="SET NULL",
        ),
    )
    action: Mapped[str] = mapped_column(String(100))
    entity: Mapped[str | None] = mapped_column(String(80))
    entity_id: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=text("CURRENT_TIMESTAMP"),
    )