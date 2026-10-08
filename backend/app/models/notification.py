from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Identity,
    Index,
    Integer,
    String,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Notification(Base):
    __tablename__ = "notifications"
    __table_args__ = (
        Index(
            "idx_notifications_user_date",
            "user_id",
            text("created_at DESC"),
        ),
        {"schema": "app"},
    )

    id: Mapped[int] = mapped_column(Integer, Identity(always=True), primary_key=True)

    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey(
            "auth.users.id",
            name="fk_notifications_user",
            ondelete="CASCADE",
        ),
    )

    title: Mapped[str] = mapped_column(String(150))
    message: Mapped[str] = mapped_column(String(300))

    action_path: Mapped[str | None] = mapped_column(String(200))

    is_read: Mapped[bool] = mapped_column(
        Boolean,
        server_default=text("false"),
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("CURRENT_TIMESTAMP"),
    )