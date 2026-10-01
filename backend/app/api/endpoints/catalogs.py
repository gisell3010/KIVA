from fastapi import APIRouter

from app.api.dependencies import CurrentUser, DbSession, PathId
from app.schemas.expense import ExpenseCategoryRead
from app.schemas.reservation import ReservationTypeRead
from app.services import catalog_service

router = APIRouter(prefix="/catalogs", tags=["Catálogos"])


@router.get(
    "/expense-categories",
    response_model=list[ExpenseCategoryRead],
)
def list_expense_categories(
    db: DbSession,
    user: CurrentUser,
):
    return catalog_service.list_expense_categories(db)


@router.get(
    "/expense-categories/{category_id}",
    response_model=ExpenseCategoryRead,
)
def get_expense_category(
    category_id: PathId,
    db: DbSession,
    user: CurrentUser,
):
    return catalog_service.get_expense_category(
        db,
        category_id,
    )


@router.get(
    "/reservation-types",
    response_model=list[ReservationTypeRead],
)
def list_reservation_types(
    db: DbSession,
    user: CurrentUser,
):
    return catalog_service.list_reservation_types(db)


@router.get(
    "/reservation-types/{type_id}",
    response_model=ReservationTypeRead,
)
def get_reservation_type(
    type_id: PathId,
    db: DbSession,
    user: CurrentUser,
):
    return catalog_service.get_reservation_type(
        db,
        type_id,
    )