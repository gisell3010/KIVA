from fastapi import APIRouter, Response

from app.api.dependencies import (
    CurrentUser,
    DbSession,
    Pagination,
    PathId,
)
from app.schemas.common import Page
from app.schemas.expense import (
    ExpenseBalanceRead,
    ExpenseCreate,
    ExpenseDetail,
    ExpenseRead,
    ExpenseUpdate,
)
from app.services import expense_service

router = APIRouter(
    prefix="/trips/{trip_id}/expenses",
    tags=["Gastos"],
)


@router.get("", response_model=Page[ExpenseRead])
def list_expenses(
    trip_id: PathId,
    db: DbSession,
    user: CurrentUser,
    pagination: Pagination,
):
    return expense_service.list_expenses(
        db,
        actor_id=user.id,
        trip_id=trip_id,
        pagination=pagination,
    )


@router.post(
    "",
    response_model=ExpenseDetail,
    status_code=201,
)
def create_expense(
    trip_id: PathId,
    data: ExpenseCreate,
    db: DbSession,
    user: CurrentUser,
):
    return expense_service.create_expense(
        db,
        actor_id=user.id,
        trip_id=trip_id,
        data=data,
    )


@router.get(
    "/balances",
    response_model=list[ExpenseBalanceRead],
)
def get_balances(
    trip_id: PathId,
    db: DbSession,
    user: CurrentUser,
):
    return expense_service.get_balances(
        db,
        actor_id=user.id,
        trip_id=trip_id,
    )


@router.get("/{expense_id}", response_model=ExpenseDetail)
def get_expense(
    trip_id: PathId,
    expense_id: PathId,
    db: DbSession,
    user: CurrentUser,
):
    return expense_service.get_expense(
        db,
        actor_id=user.id,
        trip_id=trip_id,
        expense_id=expense_id,
    )


@router.patch("/{expense_id}", response_model=ExpenseDetail)
def update_expense(
    trip_id: PathId,
    expense_id: PathId,
    data: ExpenseUpdate,
    db: DbSession,
    user: CurrentUser,
):
    return expense_service.update_expense(
        db,
        actor_id=user.id,
        trip_id=trip_id,
        expense_id=expense_id,
        data=data,
    )


@router.delete("/{expense_id}", status_code=204)
def delete_expense(
    trip_id: PathId,
    expense_id: PathId,
    db: DbSession,
    user: CurrentUser,
):
    expense_service.delete_expense(
        db,
        actor_id=user.id,
        trip_id=trip_id,
        expense_id=expense_id,
    )

    return Response(status_code=204)