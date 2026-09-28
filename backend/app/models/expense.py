from datetime import date
from decimal import Decimal

from sqlalchemy import (
    CheckConstraint, Date, ForeignKey, Identity, Index,
    Integer, Numeric, String, UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ExpenseCategory(Base):
    __tablename__ = "expense_categories"
    __table_args__ = {"schema": "app"}

    id: Mapped[int] = mapped_column(Integer, Identity(always=True), primary_key=True)
    name: Mapped[str] = mapped_column(String(80), unique=True)


class Expense(Base):
    __tablename__ = "expenses"
    __table_args__ = (
        CheckConstraint("amount > 0", name="chk_expenses_amount"),
        Index("idx_expenses_category", "category_id"),
        Index("idx_expenses_payer", "paid_by_user_id"),
        Index("idx_expenses_trip_date", "trip_id", "expense_date"),
        {"schema": "app"},
    )

    id: Mapped[int] = mapped_column(Integer, Identity(always=True), primary_key=True)
    trip_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey(
            "app.trips.id",
            name="fk_expenses_trip",
            ondelete="RESTRICT",
        ),
    )
    paid_by_user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey(
            "auth.users.id",
            name="fk_expenses_user",
            ondelete="RESTRICT",
        ),
    )
    category_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey(
            "app.expense_categories.id",
            name="fk_expenses_category",
            ondelete="RESTRICT",
        ),
    )
    title: Mapped[str] = mapped_column(String(150))
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    expense_date: Mapped[date] = mapped_column(Date)


class ExpenseSplit(Base):
    __tablename__ = "expense_splits"
    __table_args__ = (
        CheckConstraint("amount > 0", name="chk_expense_splits_amount"),
        UniqueConstraint("expense_id", "user_id", name="uq_expense_splits"),
        Index("idx_expense_splits_user", "user_id"),
        {"schema": "app"},
    )

    id: Mapped[int] = mapped_column(Integer, Identity(always=True), primary_key=True)
    expense_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey(
            "app.expenses.id",
            name="fk_expense_splits_expense",
            ondelete="CASCADE",
        ),
    )
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey(
            "auth.users.id",
            name="fk_expense_splits_user",
            ondelete="RESTRICT",
        ),
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))