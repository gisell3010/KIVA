from datetime import datetime

from sqlalchemy import (
    CheckConstraint, DateTime, ForeignKey, Identity, Index,
    Integer, String, UniqueConstraint, text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class TravelGroup(Base):
    __tablename__ = "travel_groups"
    __table_args__ = {"schema": "app"}

    id: Mapped[int] = mapped_column(Integer, Identity(always=True), primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    description: Mapped[str | None] = mapped_column(String(300))
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=text("CURRENT_TIMESTAMP"),
    )


class GroupMember(Base):
    __tablename__ = "group_members"
    __table_args__ = (
        CheckConstraint(
            "role IN ('OWNER', 'MEMBER')",
            name="chk_group_members_role",
        ),
        UniqueConstraint("group_id", "user_id", name="uq_group_members"),
        Index("idx_group_members_user", "user_id"),
        {"schema": "app"},
    )

    id: Mapped[int] = mapped_column(Integer, Identity(always=True), primary_key=True)
    group_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey(
            "app.travel_groups.id",
            name="fk_group_members_group",
            ondelete="CASCADE",
        ),
    )
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey(
            "auth.users.id",
            name="fk_group_members_user",
            ondelete="RESTRICT",
        ),
    )
    role: Mapped[str] = mapped_column(String(20), server_default="MEMBER")
    joined_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=text("CURRENT_TIMESTAMP"),
    )