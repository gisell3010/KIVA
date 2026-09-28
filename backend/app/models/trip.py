from datetime import date, datetime

from sqlalchemy import (
    CheckConstraint, Date, DateTime, ForeignKey, Identity,
    Index, Integer, String, UniqueConstraint, text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Trip(Base):
    __tablename__ = "trips"
    __table_args__ = (
        CheckConstraint(
            "end_date IS NULL OR (start_date IS NOT NULL AND end_date >= start_date)",
            name="chk_trips_dates",
        ),
        CheckConstraint(
            "status IN ('PLANNING', 'CONFIRMED', 'COMPLETED', 'CANCELLED')",
            name="chk_trips_status",
        ),
        Index("idx_trips_group", "group_id"),
        {"schema": "app"},
    )

    id: Mapped[int] = mapped_column(Integer, Identity(always=True), primary_key=True)
    group_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey(
            "app.travel_groups.id",
            name="fk_trips_group",
            ondelete="RESTRICT",
        ),
    )
    name: Mapped[str] = mapped_column(String(150))
    description: Mapped[str | None] = mapped_column(String(300))
    start_date: Mapped[date | None] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date)
    status: Mapped[str] = mapped_column(String(20), server_default="PLANNING")
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=text("CURRENT_TIMESTAMP"),
    )


class TripMember(Base):
    __tablename__ = "trip_members"
    __table_args__ = (
        CheckConstraint(
            "role IN ('OWNER', 'ORGANIZER', 'MEMBER')",
            name="chk_trip_members_role",
        ),
        UniqueConstraint("trip_id", "user_id", name="uq_trip_members"),
        Index("idx_trip_members_user", "user_id"),
        {"schema": "app"},
    )

    id: Mapped[int] = mapped_column(Integer, Identity(always=True), primary_key=True)
    trip_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey(
            "app.trips.id",
            name="fk_trip_members_trip",
            ondelete="CASCADE",
        ),
    )
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey(
            "auth.users.id",
            name="fk_trip_members_user",
            ondelete="RESTRICT",
        ),
    )
    role: Mapped[str] = mapped_column(String(20), server_default="MEMBER")