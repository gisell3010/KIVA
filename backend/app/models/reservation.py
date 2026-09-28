from datetime import date
from decimal import Decimal

from sqlalchemy import (
    CheckConstraint, Date, ForeignKey, Identity,
    Index, Integer, Numeric, String,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ReservationType(Base):
    __tablename__ = "reservation_types"
    __table_args__ = {"schema": "app"}

    id: Mapped[int] = mapped_column(Integer, Identity(always=True), primary_key=True)
    name: Mapped[str] = mapped_column(String(80), unique=True)


class Reservation(Base):
    __tablename__ = "reservations"
    __table_args__ = (
        CheckConstraint(
            "amount IS NULL OR amount >= 0",
            name="chk_reservations_amount",
        ),
        CheckConstraint(
            "status IN ('PENDING', 'CONFIRMED', 'CANCELLED')",
            name="chk_reservations_status",
        ),
        Index("idx_reservations_trip_date", "trip_id", "reservation_date"),
        Index("idx_reservations_type", "type_id"),
        {"schema": "app"},
    )

    id: Mapped[int] = mapped_column(Integer, Identity(always=True), primary_key=True)
    trip_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey(
            "app.trips.id",
            name="fk_reservations_trip",
            ondelete="CASCADE",
        ),
    )
    type_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey(
            "app.reservation_types.id",
            name="fk_reservations_type",
            ondelete="RESTRICT",
        ),
    )
    title: Mapped[str] = mapped_column(String(150))
    provider: Mapped[str | None] = mapped_column(String(150))
    reservation_date: Mapped[date | None] = mapped_column(Date)
    amount: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    status: Mapped[str] = mapped_column(String(20), server_default="PENDING")