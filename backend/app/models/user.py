from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, Identity, Integer, String, text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint(
            "role IN ('SUPER_ADMIN', 'ADMIN', 'SUPPORT', 'USER')",
            name="chk_users_role",
        ),
        CheckConstraint(
            "status IN ('ACTIVE', 'SUSPENDED')",
            name="chk_users_status",
        ),
        {"schema": "auth"},
    )

    id: Mapped[int] = mapped_column(Integer, Identity(always=True), primary_key=True)
    full_name: Mapped[str] = mapped_column(String(120))
    username: Mapped[str] = mapped_column(String(50), unique=True)
    email: Mapped[str] = mapped_column(String(150), unique=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(20), server_default="USER")
    status: Mapped[str] = mapped_column(String(20), server_default="ACTIVE")
    profile_image: Mapped[str | None] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=text("CURRENT_TIMESTAMP"),
    )