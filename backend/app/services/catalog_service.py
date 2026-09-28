from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import AppError
from app.models.expense import ExpenseCategory
from app.models.reservation import ReservationType


def list_expense_categories(db: Session) -> list[ExpenseCategory]:
    statement = select(ExpenseCategory).order_by(
        ExpenseCategory.name,
        ExpenseCategory.id,
    )
    return list(db.scalars(statement).all())


def get_expense_category(
    db: Session,
    category_id: int,
) -> ExpenseCategory:
    category = db.get(ExpenseCategory, category_id)

    if category is None:
        raise AppError(
            "La categoría de gasto no existe.",
            status_code=404,
            code="EXPENSE_CATEGORY_NOT_FOUND",
        )

    return category


def list_reservation_types(db: Session) -> list[ReservationType]:
    statement = select(ReservationType).order_by(
        ReservationType.name,
        ReservationType.id,
    )
    return list(db.scalars(statement).all())


def get_reservation_type(
    db: Session,
    type_id: int,
) -> ReservationType:
    reservation_type = db.get(ReservationType, type_id)

    if reservation_type is None:
        raise AppError(
            "El tipo de reserva no existe.",
            status_code=404,
            code="RESERVATION_TYPE_NOT_FOUND",
        )

    return reservation_type