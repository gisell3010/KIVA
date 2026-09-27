from sqlalchemy import or_, select, update

from app.models.activity import Activity
from app.models.destination import Destination
from app.models.destination_photo import DestinationPhoto
from app.models.expense import Expense, ExpenseSplit
from app.models.group import GroupMember
from app.models.poll import Poll, PollOption, Vote
from app.models.trip import Trip, TripMember
from app.schemas.trip import TripMemberRead, TripRead
from app.services.notification_service import create_notification
from app.services._shared import (
    MANAGERS,
    active_user,
    after_transaction,
    allow,
    apply_patch,
    atomic,
    audit,
    editable,
    fail,
    group_access,
    page,
    participant,
    required,
    saved,
    trip_access,
    visible_trips,
)
from app.storage.destination_images import remove_image


def list_trips(
    db,
    *,
    actor_id,
    pagination,
    group_id=None,
):
    active_user(db, actor_id)

    statement = select(Trip).where(
        Trip.id.in_(visible_trips(actor_id))
    )

    if group_id is not None:
        group_access(db, actor_id, group_id)
        statement = statement.where(
            Trip.group_id == group_id
        )

    return page(
        db,
        statement.order_by(Trip.id.desc()),
        pagination,
        TripRead,
    )


def get_trip(db, *, actor_id, trip_id):
    trip, _ = trip_access(db, actor_id, trip_id)
    return TripRead.model_validate(trip)


@atomic
def create_trip(db, *, actor_id, data):
    group_access(
        db,
        actor_id,
        data.group_id,
        lock=True,
    )

    trip = Trip(
        **data.model_dump(),
        status="PLANNING",
    )

    db.add(trip)
    db.flush()

    db.add(
        TripMember(
            trip_id=trip.id,
            user_id=actor_id,
            role="OWNER",
        )
    )

    audit(db, actor_id, "TRIP_CREATE", trip)

    return saved(db, trip, TripRead)


@atomic
def update_trip(db, *, actor_id, trip_id, data):
    trip, member = trip_access(
        db,
        actor_id,
        trip_id,
        lock=True,
    )

    allow(member.role, MANAGERS)
    editable(trip)

    changes = data.model_dump(exclude_unset=True)
    start = changes.get("start_date", trip.start_date)
    end = changes.get("end_date", trip.end_date)

    if end is not None and (start is None or end < start):
        fail(
            "El periodo del viaje no es válido.",
            "INVALID_DATES",
            422,
        )

    outside = []

    if start is not None:
        outside.append(Activity.activity_date < start)

    if end is not None:
        outside.append(Activity.activity_date > end)

    if outside and db.scalar(
        select(Activity.id)
        .where(
            Activity.trip_id == trip_id,
            or_(*outside),
        )
        .limit(1)
    ):
        fail(
            "El periodo dejaría actividades fuera del viaje.",
            "ACTIVITY_DATES",
        )

    allowed = {
        "PLANNING": {
            "PLANNING",
            "CONFIRMED",
            "CANCELLED",
        },
        "CONFIRMED": {
            "CONFIRMED",
            "PLANNING",
            "COMPLETED",
            "CANCELLED",
        },
    }

    if changes.get("status", trip.status) not in allowed[trip.status]:
        fail(
            "El cambio de estado no está permitido.",
            "INVALID_STATUS",
        )

    apply_patch(trip, data)

    if trip.status in {"COMPLETED", "CANCELLED"}:
        db.execute(
            update(Poll)
            .where(
                Poll.trip_id == trip_id,
                Poll.status == "OPEN",
            )
            .values(status="CLOSED")
        )

    audit(db, actor_id, "TRIP_UPDATE", trip)

    return saved(db, trip, TripRead)


def list_members(db, *, actor_id, trip_id, pagination):
    trip_access(db, actor_id, trip_id)

    return page(
        db,
        select(TripMember)
        .where(TripMember.trip_id == trip_id)
        .order_by(TripMember.id),
        pagination,
        TripMemberRead,
    )


@atomic
def add_member(db, *, actor_id, trip_id, data):
    trip, actor = trip_access(
        db,
        actor_id,
        trip_id,
        lock=True,
    )

    allow(actor.role, MANAGERS)
    editable(trip)

    if data.role == "ORGANIZER":
        allow(actor.role, {"OWNER"})

    active_user(db, data.user_id)

    required(
        db,
        select(GroupMember).where(
            GroupMember.group_id == trip.group_id,
            GroupMember.user_id == data.user_id,
        ),
    )

    if db.scalar(
        select(TripMember.id).where(
            TripMember.trip_id == trip_id,
            TripMember.user_id == data.user_id,
        )
    ):
        fail(
            "El usuario ya pertenece al viaje.",
            "MEMBER_EXISTS",
        )

    member = TripMember(
        trip_id=trip_id,
        **data.model_dump(),
    )

    db.add(member)

    result = saved(db, member, TripMemberRead)

    create_notification(
        db,
        user_id=data.user_id,
        title="Nuevo viaje",
        message=f"Te agregaron al viaje {trip.name}.",
    )

    audit(db, actor_id, "TRIP_MEMBER_ADD", member)

    return result


@atomic
def update_member(
    db,
    *,
    actor_id,
    trip_id,
    user_id,
    data,
):
    trip, actor = trip_access(
        db,
        actor_id,
        trip_id,
        lock=True,
    )

    allow(actor.role, {"OWNER"})
    member = participant(db, trip, user_id)

    if member.role == "OWNER":
        fail(
            "Utiliza la transferencia de propiedad.",
            "OWNER_REQUIRED",
        )

    member.role = data.role
    audit(db, actor_id, "TRIP_MEMBER_UPDATE", member)

    return saved(db, member, TripMemberRead)


@atomic
def remove_member(db, *, actor_id, trip_id, user_id):
    trip, actor = trip_access(
        db,
        actor_id,
        trip_id,
        lock=True,
    )

    member = participant(db, trip, user_id)

    if member.role == "OWNER":
        fail(
            "Transfiere la propiedad antes de salir.",
            "OWNER_REQUIRED",
        )

    if actor_id != user_id:
        roles = (
            {"OWNER"}
            if member.role == "ORGANIZER"
            else MANAGERS
        )
        allow(actor.role, roles)

    dependencies = [
        select(Destination.id).where(
            Destination.trip_id == trip_id,
            Destination.proposed_by_user_id == user_id,
        ),
        select(DestinationPhoto.id)
        .join(Destination)
        .where(
            Destination.trip_id == trip_id,
            DestinationPhoto.uploaded_by_user_id == user_id,
        ),
        select(Expense.id).where(
            Expense.trip_id == trip_id,
            Expense.paid_by_user_id == user_id,
        ),
        select(ExpenseSplit.id)
        .join(Expense)
        .where(
            Expense.trip_id == trip_id,
            ExpenseSplit.user_id == user_id,
        ),
        select(Vote.id)
        .join(PollOption)
        .join(Poll)
        .where(
            Poll.trip_id == trip_id,
            Vote.user_id == user_id,
        ),
    ]

    if any(
        db.scalar(query.limit(1)) is not None
        for query in dependencies
    ):
        fail(
            "El participante tiene registros asociados al viaje.",
            "MEMBER_HAS_RECORDS",
        )

    audit(db, actor_id, "TRIP_MEMBER_REMOVE", member)
    db.delete(member)


@atomic
def transfer_ownership(db, *, actor_id, trip_id, data):
    trip, owner = trip_access(
        db,
        actor_id,
        trip_id,
        lock=True,
    )

    allow(owner.role, {"OWNER"})
    active_user(db, data.new_owner_user_id)

    successor = participant(
        db,
        trip,
        data.new_owner_user_id,
    )

    if successor.id != owner.id:
        owner.role = "ORGANIZER"
        successor.role = "OWNER"
        audit(db, actor_id, "TRIP_OWNER_CHANGE", trip)

    return saved(db, successor, TripMemberRead)


@atomic
def delete_trip(db, *, actor_id, trip_id):
    trip, member = trip_access(
        db,
        actor_id,
        trip_id,
        lock=True,
    )

    allow(member.role, {"OWNER"})

    if db.scalar(
        select(Expense.id)
        .where(Expense.trip_id == trip_id)
        .limit(1)
    ):
        fail(
            "El viaje tiene gastos registrados.",
            "TRIP_HAS_EXPENSES",
        )

    paths = db.scalars(
        select(DestinationPhoto.file_path)
        .join(Destination)
        .where(Destination.trip_id == trip_id)
    ).all()

    for key in paths:
        after_transaction(
            db,
            lambda key=key: remove_image(key),
        )

    audit(db, actor_id, "TRIP_DELETE", trip)
    db.delete(trip)