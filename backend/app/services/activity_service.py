from sqlalchemy import select

from app.models.activity import Activity
from app.schemas.activity import ActivityRead
from app.services.notification_service import notify_trip_members
from app.services._shared import (
    MANAGERS,
    allow,
    apply_patch,
    atomic,
    audit,
    editable,
    fail,
    page,
    saved,
    trip_access,
    trip_item,
)


def _date(trip, value):
    if (
        trip.start_date is not None
        and value < trip.start_date
    ) or (
        trip.end_date is not None
        and value > trip.end_date
    ):
        fail(
            "La actividad debe estar dentro del periodo del viaje.",
            "INVALID_DATE",
            422,
        )


def list_activities(db, *, actor_id, trip_id, pagination):
    trip_access(db, actor_id, trip_id)

    return page(
        db,
        select(Activity)
        .where(Activity.trip_id == trip_id)
        .order_by(
            Activity.activity_date,
            Activity.start_time.nulls_last(),
            Activity.id,
        ),
        pagination,
        ActivityRead,
    )


def get_activity(db, *, actor_id, trip_id, activity_id):
    _, _, item = trip_item(
        db, actor_id, trip_id, Activity, activity_id
    )

    return ActivityRead.model_validate(item)


@atomic
def create_activity(db, *, actor_id, trip_id, data):
    trip, _ = trip_access(
        db, actor_id, trip_id, lock=True
    )

    editable(trip)
    _date(trip, data.activity_date)

    item = Activity(
        trip_id=trip_id,
        status="PROPOSED",
        **data.model_dump(),
    )

    db.add(item)
    result = saved(db, item, ActivityRead)
    audit(db, actor_id, "ACTIVITY_CREATE", item)

    return result


@atomic
def update_activity(
    db,
    *,
    actor_id,
    trip_id,
    activity_id,
    data,
):
    trip, member, item = trip_item(
        db,
        actor_id,
        trip_id,
        Activity,
        activity_id,
        lock=True,
    )

    allow(member.role, MANAGERS)
    editable(trip)

    values = data.model_dump(exclude_unset=True)
    _date(
        trip,
        values.get("activity_date", item.activity_date),
    )

    transitions = {
        "PROPOSED": {"PROPOSED", "APPROVED", "CANCELLED"},
        "APPROVED": {"APPROVED", "PROPOSED", "CANCELLED"},
        "CANCELLED": {"CANCELLED", "PROPOSED"},
    }

    if values.get("status", item.status) not in transitions[item.status]:
        fail(
            "El cambio de estado no está permitido.",
            "INVALID_STATUS",
        )

    previous_status = item.status
    apply_patch(item, data)

    if item.status != previous_status and item.status in {"APPROVED", "CANCELLED"}:
        label = "aprobada" if item.status == "APPROVED" else "cancelada"
        notify_trip_members(
            db,
            action_path=f"/itinerario?trip={trip_id}",
            trip_id=trip_id,
            title="Actividad actualizada",
            message=f'La actividad "{item.title}" fue {label} en {trip.name}.',
            exclude_user_id=actor_id,
        )

    audit(db, actor_id, "ACTIVITY_UPDATE", item)

    return saved(db, item, ActivityRead)


@atomic
def delete_activity(db, *, actor_id, trip_id, activity_id):
    trip, member, item = trip_item(
        db,
        actor_id,
        trip_id,
        Activity,
        activity_id,
        lock=True,
    )

    allow(member.role, MANAGERS)
    editable(trip)

    audit(db, actor_id, "ACTIVITY_DELETE", item)
    db.delete(item)