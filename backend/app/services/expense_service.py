from decimal import Decimal

from sqlalchemy import delete, func, select

from app.models.expense import Expense, ExpenseSplit
from app.models.trip import TripMember
from app.schemas.expense import (
    ExpenseBalanceRead,
    ExpenseDetail,
    ExpenseRead,
    ExpenseSplitRead,
)
from app.services.catalog_service import get_expense_category
from app.services.notification_service import create_notification
from app.services._shared import (
    MANAGERS,
    allow,
    atomic,
    audit,
    fail,
    page,
    participant,
    trip_access,
    trip_item,
)


def _splits(db, expense_id):
    return list(
        db.scalars(
            select(ExpenseSplit)
            .where(ExpenseSplit.expense_id == expense_id)
            .order_by(ExpenseSplit.id)
        )
    )


def _detail(db, item):
    return ExpenseDetail(
        **ExpenseRead.model_validate(item).model_dump(),
        splits=[
            ExpenseSplitRead.model_validate(split)
            for split in _splits(db, item.id)
        ],
    )


def _validate(db, trip, payer, category, amount, splits):
    participant(db, trip, payer)
    get_expense_category(db, category)

    ids = [split.user_id for split in splits]

    if not splits or len(ids) != len(set(ids)):
        fail("El reparto no es válido.", "INVALID_SPLITS", 422)

    if any(split.amount <= 0 for split in splits):
        fail(
            "Los repartos deben ser positivos.",
            "INVALID_SPLITS",
            422,
        )

    total = sum(
        (split.amount for split in splits),
        Decimal("0"),
    )

    if total != amount:
        fail(
            "La suma del reparto debe coincidir con el gasto.",
            "INVALID_SPLITS",
            422,
        )

    for user_id in ids:
        participant(db, trip, user_id)


def list_expenses(db, *, actor_id, trip_id, pagination):
    trip_access(db, actor_id, trip_id)

    return page(
        db,
        select(Expense)
        .where(Expense.trip_id == trip_id)
        .order_by(
            Expense.expense_date.desc(),
            Expense.id.desc(),
        ),
        pagination,
        ExpenseRead,
    )


def get_expense(db, *, actor_id, trip_id, expense_id):
    _, _, item = trip_item(
        db,
        actor_id,
        trip_id,
        Expense,
        expense_id,
        lock=True,
    )

    return _detail(db, item)


@atomic
def create_expense(db, *, actor_id, trip_id, data):
    trip, member = trip_access(
        db, actor_id, trip_id, lock=True
    )

    if data.paid_by_user_id != actor_id:
        allow(member.role, MANAGERS)

    _validate(
        db,
        trip,
        data.paid_by_user_id,
        data.category_id,
        data.amount,
        data.splits,
    )

    item = Expense(
        trip_id=trip_id,
        **data.model_dump(exclude={"splits"}),
    )

    db.add(item)
    db.flush()

    db.add_all(
        [
            ExpenseSplit(
                expense_id=item.id,
                **split.model_dump(),
            )
            for split in data.splits
        ]
    )

    db.flush()

    for user_id in {
        split.user_id
        for split in data.splits
        if split.user_id != actor_id
    }:
        create_notification(
            db,
            action_path=f"/gastos?trip={trip_id}",
            user_id=user_id,
            title="Nuevo gasto compartido",
            message=f'Se registró el gasto "{item.title}" en {trip.name}.',
        )

    audit(db, actor_id, "EXPENSE_CREATE", item)

    return _detail(db, item)


@atomic
def update_expense(
    db,
    *,
    actor_id,
    trip_id,
    expense_id,
    data,
):
    trip, member, item = trip_item(
        db,
        actor_id,
        trip_id,
        Expense,
        expense_id,
        lock=True,
    )

    changes = data.model_dump(
        exclude_unset=True,
        exclude={"splits"},
    )

    payer = changes.get(
        "paid_by_user_id",
        item.paid_by_user_id,
    )

    if item.paid_by_user_id != actor_id or payer != actor_id:
        allow(member.role, MANAGERS)

    splits = (
        data.splits
        if data.splits is not None
        else _splits(db, item.id)
    )

    _validate(
        db,
        trip,
        payer,
        changes.get("category_id", item.category_id),
        changes.get("amount", item.amount),
        splits,
    )

    for name, value in changes.items():
        setattr(item, name, value)

    if data.splits is not None:
        db.execute(
            delete(ExpenseSplit).where(
                ExpenseSplit.expense_id == item.id
            )
        )

        db.add_all(
            [
                ExpenseSplit(
                    expense_id=item.id,
                    **split.model_dump(),
                )
                for split in data.splits
            ]
        )

    db.flush()
    audit(db, actor_id, "EXPENSE_UPDATE", item)

    return _detail(db, item)


@atomic
def delete_expense(db, *, actor_id, trip_id, expense_id):
    _, member, item = trip_item(
        db,
        actor_id,
        trip_id,
        Expense,
        expense_id,
        lock=True,
    )

    if item.paid_by_user_id != actor_id:
        allow(member.role, MANAGERS)

    audit(db, actor_id, "EXPENSE_DELETE", item)
    db.delete(item)


def get_balances(db, *, actor_id, trip_id):
    trip_access(db, actor_id, trip_id, lock=True)

    paid = dict(
        db.execute(
            select(
                Expense.paid_by_user_id,
                func.sum(Expense.amount),
            )
            .where(Expense.trip_id == trip_id)
            .group_by(Expense.paid_by_user_id)
        ).all()
    )

    shares = dict(
        db.execute(
            select(
                ExpenseSplit.user_id,
                func.sum(ExpenseSplit.amount),
            )
            .join(
                Expense,
                Expense.id == ExpenseSplit.expense_id,
            )
            .where(Expense.trip_id == trip_id)
            .group_by(ExpenseSplit.user_id)
        ).all()
    )

    users = db.scalars(
        select(TripMember.user_id)
        .where(TripMember.trip_id == trip_id)
        .order_by(TripMember.user_id)
    ).all()

    zero = Decimal("0.00")

    return [
        ExpenseBalanceRead(
            user_id=user_id,
            total_paid=paid.get(user_id, zero),
            total_share=shares.get(user_id, zero),
            balance=(
                paid.get(user_id, zero)
                - shares.get(user_id, zero)
            ),
        )
        for user_id in users
    ]