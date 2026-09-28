from sqlalchemy import Boolean, ForeignKey, Identity, Index, Integer, String, text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Destination(Base):
    __tablename__ = "destinations"
    __table_args__ = (
        Index("idx_destinations_proposer", "proposed_by_user_id"),
        Index("idx_destinations_trip", "trip_id"),
        {"schema": "app"},
    )

    id: Mapped[int] = mapped_column(Integer, Identity(always=True), primary_key=True)
    trip_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey(
            "app.trips.id",
            name="fk_destinations_trip",
            ondelete="CASCADE",
        ),
    )
    proposed_by_user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey(
            "auth.users.id",
            name="fk_destinations_user",
            ondelete="RESTRICT",
        ),
    )
    country: Mapped[str] = mapped_column(String(100))
    place_name: Mapped[str] = mapped_column(String(150))
    description: Mapped[str | None] = mapped_column(String(300))
    is_selected: Mapped[bool] = mapped_column(
        Boolean,
        server_default=text("false"),
    )