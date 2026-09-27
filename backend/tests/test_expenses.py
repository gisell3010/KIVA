from decimal import Decimal

import pytest
from pydantic import ValidationError

from app.schemas.expense import ExpenseCreate, ExpenseUpdate
from app.services import trip_service
from app.services import expense_service as service


@pytest.fixture
def expense_data(scenario):
    return ExpenseCreate(
        paid_by_user_id=scenario.member.id,
        category_id=scenario.category.id,
        title="Transporte",
        amount="100.00",
        expense_date=scenario.trip.start_date,
        splits=[
            {
                "user_id": scenario.owner.id,
                "amount": "50.00",
            },
            {
                "user_id": scenario.member.id,
                "amount": "50.00",
            },
        ],
    )


def test_expense_balances(db, scenario, expense_data):
    service.create_expense(
        db,
        actor_id=scenario.member.id,
        trip_id=scenario.trip.id,
        data=expense_data,
    )

    balances = service.get_balances(
        db,
        actor_id=scenario.owner.id,
        trip_id=scenario.trip.id,
    )

    by_user = {
        item.user_id: item.balance
        for item in balances
    }

    assert by_user[scenario.member.id] == Decimal("50.00")
    assert by_user[scenario.owner.id] == Decimal("-50.00")
    assert sum(by_user.values()) == 0


def test_partial_amount_update_rolls_back(
    db,
    scenario,
    expense_data,
    expect_error,
):
    item = service.create_expense(
        db,
        actor_id=scenario.member.id,
        trip_id=scenario.trip.id,
        data=expense_data,
    )

    with expect_error(422, "INVALID_SPLITS"):
        service.update_expense(
            db,
            actor_id=scenario.member.id,
            trip_id=scenario.trip.id,
            expense_id=item.id,
            data=ExpenseUpdate(amount="80.00"),
        )

    result = service.get_expense(
        db,
        actor_id=scenario.member.id,
        trip_id=scenario.trip.id,
        expense_id=item.id,
    )

    assert result.amount == Decimal("100.00")

    assert sum(
        split.amount for split in result.splits
    ) == result.amount


def test_outsider_cannot_receive_split(
    db,
    scenario,
    expense_data,
    expect_error,
):
    values = expense_data.model_dump()

    values["splits"] = [
        {
            "user_id": scenario.outsider.id,
            "amount": "100.00",
        }
    ]

    with expect_error(404):
        service.create_expense(
            db,
            actor_id=scenario.member.id,
            trip_id=scenario.trip.id,
            data=ExpenseCreate(**values),
        )


def test_duplicate_beneficiaries_rejected(
    expense_data,
    scenario,
):
    values = expense_data.model_dump()

    values["splits"] = [
        {
            "user_id": scenario.member.id,
            "amount": "50.00",
        }
    ] * 2

    with pytest.raises(ValidationError):
        ExpenseCreate(**values)


def test_trip_with_expenses_cannot_be_deleted(
    db,
    scenario,
    expense_data,
    expect_error,
):
    service.create_expense(
        db,
        actor_id=scenario.member.id,
        trip_id=scenario.trip.id,
        data=expense_data,
    )

    with expect_error(409, "TRIP_HAS_EXPENSES"):
        trip_service.delete_trip(
            db,
            actor_id=scenario.owner.id,
            trip_id=scenario.trip.id,
        )