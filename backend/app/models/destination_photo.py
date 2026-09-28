from datetime import datetime

from sqlalchemy import (
    CheckConstraint, DateTime, ForeignKey, Identity, Index,
    Integer, String, UniqueConstraint, text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class DestinationPhoto(Base):
    __tablename__ = "destination_photos"
    __table_args__ = (
        UniqueConstraint(
            "destination_id",
            "position",
            name="uq_destination_photos_position",
        ),
        CheckConstraint(
            "position > 0",
            name="chk_destination_photos_position",
        ),
        Index("idx_destination_photos_user", "uploaded_by_user_id"),
        {"schema": "app"},
    )

    id: Mapped[int] = mapped_column(Integer, Identity(always=True), primary_key=True)
    destination_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey(
            "app.destinations.id",
            name="fk_destination_photos_destination",
            ondelete="CASCADE",
        ),
    )
    uploaded_by_user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey(
            "auth.users.id",
            name="fk_destination_photos_user",
            ondelete="RESTRICT",
        ),
    )
    file_path: Mapped[str] = mapped_column(String(255), unique=True)
    position: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=text("CURRENT_TIMESTAMP"),
    )