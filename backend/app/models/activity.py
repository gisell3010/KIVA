from datetime import date, time
from decimal import Decimal

from sqlalchemy import (
    CheckConstraint, Date, ForeignKey, Identity, Index,
    Integer, Numeric, String, Time,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Activity(Base):
    __tablename__ = "activities"
    __table_args__ = (
        CheckConstraint(
            "estimated_cost IS NULL OR estimated_cost >= 0",
            name="chk_activities_cost",
        ),
        CheckConstraint(
            "status IN ('PROPOSED', 'APPROVED', 'CANCELLED')",
            name="chk_activities_status",
        ),
        Index(
            "idx_activities_trip_date",
            "trip_id",
            "activity_date",
            "start_time",
        ),
        {"schema": "app"},
    )

    id: Mapped[int] = mapped_column(Integer, Identity(always=True), primary_key=True)
    trip_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey(
            "app.trips.id",
            name="fk_activities_trip",
            ondelete="CASCADE",
        ),
    )
    title: Mapped[str] = mapped_column(String(150))
    description: Mapped[str | None] = mapped_column(String(300))
    location: Mapped[str | None] = mapped_column(String(150))
    activity_date: Mapped[date] = mapped_column(Date)
    start_time: Mapped[time | None] = mapped_column(Time)
    estimated_cost: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    status: Mapped[str] = mapped_column(String(20), server_default="PROPOSED")