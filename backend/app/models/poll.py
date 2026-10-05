from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Identity,
    Index,
    Integer,
    String,
    UniqueConstraint,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Poll(Base):
    __tablename__ = "polls"
    __table_args__ = (
        CheckConstraint(
            "status IN ('OPEN', 'CLOSED')",
            name="chk_polls_status",
        ),
        Index(
            "idx_polls_trip",
            "trip_id",
        ),
        {"schema": "app"},
    )

    id: Mapped[int] = mapped_column(Integer, Identity(always=True), primary_key=True)

    trip_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey(
            "app.trips.id",
            name="fk_polls_trip",
            ondelete="CASCADE",
        ),
    )

    question: Mapped[str] = mapped_column(String(250))

    status: Mapped[str] = mapped_column(
        String(20),
        server_default="OPEN",
    )

    closes_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True)
    )


class PollOption(Base):
    __tablename__ = "poll_options"
    __table_args__ = (
        CheckConstraint(
            "option_number > 0",
            name="chk_poll_options_number",
        ),
        UniqueConstraint(
            "poll_id",
            "option_number",
            name="uq_poll_options_number",
        ),
        {"schema": "app"},
    )

    id: Mapped[int] = mapped_column(Integer, Identity(always=True), primary_key=True)

    poll_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey(
            "app.polls.id",
            name="fk_poll_options_poll",
            ondelete="CASCADE",
        ),
    )

    option_number: Mapped[int] = mapped_column(Integer)
    option_text: Mapped[str] = mapped_column(String(200))


class Vote(Base):
    __tablename__ = "votes"
    __table_args__ = (
        UniqueConstraint(
            "option_id",
            "user_id",
            name="uq_votes_option_user",
        ),
        Index(
            "idx_votes_user",
            "user_id",
        ),
        {"schema": "app"},
    )

    id: Mapped[int] = mapped_column(Integer, Identity(always=True), primary_key=True)

    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey(
            "auth.users.id",
            name="fk_votes_user",
            ondelete="RESTRICT",
        ),
    )

    option_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey(
            "app.poll_options.id",
            name="fk_votes_option",
            ondelete="CASCADE",
        ),
    )

    voted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("CURRENT_TIMESTAMP"),
    )