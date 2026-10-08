from datetime import datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
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


class SupportReport(Base):
    __tablename__ = "support_reports"
    __table_args__ = (
        CheckConstraint(
            "category IN ('ACCESS','ACCOUNT','TRIP','EXPENSE','VOTING','RESERVATION','TECHNICAL','OTHER')",
            name="chk_support_reports_category",
        ),
        CheckConstraint(
            "status IN ('OPEN','IN_REVIEW','ESCALATED','RESOLVED','CLOSED')",
            name="chk_support_reports_status",
        ),
        Index("idx_support_reports_reporter", "reported_by_user_id"),
        Index("idx_support_reports_assignee", "assigned_to_user_id"),
        Index("idx_support_reports_trip", "trip_id"),
        Index(
            "idx_support_reports_status_date",
            "status",
            text("created_at DESC"),
        ),
        {"schema": "app"},
    )

    id: Mapped[int] = mapped_column(
        Integer,
        Identity(always=True),
        primary_key=True,
    )

    reported_by_user_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey(
            "auth.users.id",
            name="fk_support_reports_reported_by",
            ondelete="SET NULL",
        ),
    )

    assigned_to_user_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey(
            "auth.users.id",
            name="fk_support_reports_assigned_to",
            ondelete="SET NULL",
        ),
    )

    trip_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey(
            "app.trips.id",
            name="fk_support_reports_trip",
            ondelete="SET NULL",
        ),
    )

    contact_email: Mapped[str] = mapped_column(String(150))
    category: Mapped[str] = mapped_column(String(30))
    subject: Mapped[str] = mapped_column(String(150))
    description: Mapped[str] = mapped_column(String(1000))

    status: Mapped[str] = mapped_column(
        String(20),
        server_default=text("'OPEN'"),
    )

    tracking_token_hash: Mapped[str | None] = mapped_column(String(64))

    response: Mapped[str | None] = mapped_column(String(1000))

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("CURRENT_TIMESTAMP"),
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=text("CURRENT_TIMESTAMP"),
    )

    resolved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
    )


class SupportMessage(Base):
    __tablename__ = "support_messages"
    __table_args__ = (
        Index("idx_support_messages_report", "report_id", "id"),
        {"schema": "app"},
    )
    id: Mapped[int] = mapped_column(Integer, Identity(always=True), primary_key=True)
    report_id: Mapped[int] = mapped_column(ForeignKey("app.support_reports.id", ondelete="CASCADE"))
    author_id: Mapped[int | None] = mapped_column(ForeignKey("auth.users.id", ondelete="SET NULL"))
    author_label: Mapped[str] = mapped_column(String(150))
    body: Mapped[str] = mapped_column(String(1000))
    is_internal: Mapped[bool] = mapped_column(Boolean, server_default=text("false"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))
