from datetime import date
from decimal import Decimal
from typing import Annotated

from pydantic import Field, model_validator

from app.schemas.common import (
    Amount,
    CatalogRead,
    Id,
    NonEmptyText,
    PatchSchema,
    PositiveMoney,
    Schema,
    TotalAmount,
    validate_unique_ids,
)

ExpenseTitle = Annotated[NonEmptyText, Field(max_length=150)]


class ExpenseCategoryRead(CatalogRead):
    pass


class ExpenseSplitCreate(Schema):
    user_id: Id
    amount: PositiveMoney


def validate_splits(
    splits: list[ExpenseSplitCreate],
    amount: Decimal | None,
) -> None:
    validate_unique_ids([split.user_id for split in splits])

    total = sum(
        (split.amount for split in splits),
        Decimal("0"),
    )

    if amount is not None and total != amount:
        raise ValueError(
            "La suma de los repartos debe coincidir con el gasto."
        )


class ExpenseCreate(Schema):
    paid_by_user_id: Id
    category_id: Id
    title: ExpenseTitle
    amount: PositiveMoney
    expense_date: date
    splits: list[ExpenseSplitCreate] = Field(min_length=1)

    @model_validator(mode="after")
    def validate_distribution(self):
        validate_splits(self.splits, self.amount)
        return self


class ExpenseUpdate(PatchSchema):
    paid_by_user_id: Id | None = None
    category_id: Id | None = None
    title: ExpenseTitle | None = None
    amount: PositiveMoney | None = None
    expense_date: date | None = None
    splits: list[ExpenseSplitCreate] | None = Field(
        default=None,
        min_length=1,
    )

    @model_validator(mode="after")
    def validate_distribution(self):
        if self.splits is not None:
            validate_splits(self.splits, self.amount)
        return self


class ExpenseSplitRead(Schema):
    id: Id
    expense_id: Id
    user_id: Id
    amount: PositiveMoney


class ExpenseRead(Schema):
    id: Id
    trip_id: Id
    paid_by_user_id: Id
    category_id: Id
    title: str
    amount: PositiveMoney
    expense_date: date


class ExpenseDetail(ExpenseRead):
    splits: list[ExpenseSplitRead]


class ExpenseBalanceRead(Schema):
    user_id: Id
    total_paid: TotalAmount
    total_share: TotalAmount
    balance: Amount