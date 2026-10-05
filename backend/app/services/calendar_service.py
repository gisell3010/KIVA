from datetime import datetime, time, timezone

from sqlalchemy import select

from app.models.activity import Activity
from app.models.expense import Expense
from app.models.poll import Poll
from app.models.reservation import Reservation
from app.models.trip import Trip
from app.schemas.calendar import CalendarEventRead
from app.services._shared import (
    active_user,
    fail,
    trip_access,
    visible_trips,
)


def list_events(
    db,
    *,
    actor_id,
    start_date,
    end_date,
    trip_id=None,
):
    active_user(db, actor_id)

    if (
        end_date < start_date
        or (end_date - start_date).days > 366
    ):
        fail(
            "El rango debe ser válido y no superar 366 días.",
            "INVALID_RANGE",
            422,
        )

    scope = visible_trips(actor_id)

    if trip_id is not None:
        trip_access(db, actor_id, trip_id)
        scope = select(Trip.id).where(Trip.id == trip_id)

    scope = scope.where(Trip.status != "CANCELLED")
    events = []

    for trip in db.scalars(
        select(Trip).where(Trip.id.in_(scope))
    ):
        for label, value in (
            ("Inicio", trip.start_date),
            ("Fin", trip.end_date),
        ):
            if value is not None and start_date <= value <= end_date:
                events.append(
                    CalendarEventRead(
                        trip_id=trip.id,
                        source_type="TRIP",
                        source_id=trip.id,
                        title=f"{label}: {trip.name}",
                        event_date=value,
                    )
                )

    sources = [
        (Activity, "ACTIVITY", Activity.activity_date),
        (Reservation, "RESERVATION", Reservation.reservation_date),
        (Expense, "EXPENSE", Expense.expense_date),
    ]

    for model, kind, date_column in sources:
        statement = select(model).where(
            model.trip_id.in_(scope),
            date_column.between(start_date, end_date),
        )

        if model in (Activity, Reservation):
            statement = statement.where(
                model.status != "CANCELLED"
            )

        for item in db.scalars(statement):
            events.append(
                CalendarEventRead(
                    trip_id=item.trip_id,
                    source_type=kind,
                    source_id=item.id,
                    title=item.title,
                    event_date=getattr(item, date_column.key),
                    start_time=(
                        item.start_time
                        if model is Activity
                        else None
                    ),
                )
            )

    lower = datetime.combine(
        start_date,
        time.min,
        tzinfo=timezone.utc,
    )
    upper = datetime.combine(
        end_date,
        time.max,
        tzinfo=timezone.utc,
    )

    for poll in db.scalars(
        select(Poll).where(
            Poll.trip_id.in_(scope),
            Poll.closes_at.between(lower, upper),
        )
    ):
        events.append(
            CalendarEventRead(
                trip_id=poll.trip_id,
                source_type="POLL",
                source_id=poll.id,
                title=poll.question,
                deadline_at=poll.closes_at,
            )
        )

    return sorted(
        events,
        key=lambda event: (
            event.event_date or event.deadline_at.date(),
            event.start_time
            or (
                event.deadline_at.time()
                if event.deadline_at
                else time.min
            ),
            event.source_type,
            event.source_id,
        ),
    )