import logging
from datetime import datetime, timezone
from functools import wraps

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError

from app.core.exceptions import AppError
from app.models.group import GroupMember, TravelGroup
from app.models.trip import Trip, TripMember
from app.models.user import User
from app.schemas.common import Page
from app.services.audit_service import record_action

MANAGERS = {"OWNER", "ORGANIZER"}


def atomic(function):
    @wraps(function)
    def wrapper(db, *args, **kwargs):
        if "service_hooks" in db.info:
            raise RuntimeError(
                "No anides servicios que confirman transacciones."
            )

        hooks = {"commit": [], "rollback": []}
        db.info["service_hooks"] = hooks
        outcome = "rollback"

        try:
            result = function(db, *args, **kwargs)
            db.commit()
            outcome = "commit"
            return result
        except IntegrityError as exc:
            db.rollback()
            code = getattr(exc.orig, "sqlstate", None)

            if code in {"23505", "23503"}:
                raise AppError(
                    "El registro está duplicado o tiene relaciones pendientes.",
                    409,
                    "DATA_CONFLICT",
                ) from None

            raise
        except Exception:
            db.rollback()
            raise
        finally:
            db.info.pop("service_hooks", None)

            for callback in hooks[outcome]:
                try:
                    callback()
                except OSError:
                    logging.getLogger("kiva.storage").error(
                        "No se pudo completar la limpieza de una imagen."
                    )

    return wrapper


def after_transaction(db, callback, *, rollback=False):
    outcome = "rollback" if rollback else "commit"
    db.info["service_hooks"][outcome].append(callback)


def fail(message, code="INVALID_OPERATION", status=409):
    raise AppError(message, status, code)


def required(db, statement):
    obj = db.scalar(
        statement.execution_options(populate_existing=True)
    )

    if obj is None:
        fail("Registro no disponible.", "NOT_FOUND", 404)

    return obj


def active_user(db, user_id, *, lock=False):
    statement = select(User).where(User.id == user_id)

    if lock:
        statement = statement.with_for_update()

    user = required(db, statement)

    if user.status != "ACTIVE":
        fail("La cuenta no está activa.", "ACCOUNT_INACTIVE", 403)

    return user


def allow(role, roles):
    if role not in roles:
        fail(
            "No tienes permiso para esta operación.",
            "FORBIDDEN",
            403,
        )


def group_access(db, actor_id, group_id, *, lock=False):
    active_user(db, actor_id)

    statement = select(TravelGroup).where(
        TravelGroup.id == group_id
    )

    if lock:
        statement = statement.with_for_update()

    group = required(db, statement)
    member = required(
        db,
        select(GroupMember).where(
            GroupMember.group_id == group_id,
            GroupMember.user_id == actor_id,
        ),
    )

    return group, member


def trip_access(db, actor_id, trip_id, *, lock=False):
    group_id = db.scalar(
        select(Trip.group_id).where(Trip.id == trip_id)
    )

    if group_id is None:
        fail("Viaje no disponible.", "NOT_FOUND", 404)

    group_access(db, actor_id, group_id, lock=lock)

    statement = select(Trip).where(Trip.id == trip_id)

    if lock:
        statement = statement.with_for_update()

    trip = required(db, statement)
    member = required(
        db,
        select(TripMember).where(
            TripMember.trip_id == trip_id,
            TripMember.user_id == actor_id,
        ),
    )

    return trip, member


def trip_item(
    db,
    actor_id,
    trip_id,
    model,
    item_id,
    *,
    lock=False,
):
    trip, member = trip_access(
        db, actor_id, trip_id, lock=lock
    )

    item = required(
        db,
        select(model).where(
            model.id == item_id,
            model.trip_id == trip_id,
        ),
    )

    return trip, member, item


def participant(db, trip, user_id):
    required(
        db,
        select(GroupMember).where(
            GroupMember.group_id == trip.group_id,
            GroupMember.user_id == user_id,
        ),
    )

    return required(
        db,
        select(TripMember).where(
            TripMember.trip_id == trip.id,
            TripMember.user_id == user_id,
        ),
    )


def editable(trip):
    if trip.status in {"COMPLETED", "CANCELLED"}:
        fail("El viaje ya está finalizado.", "TRIP_FINISHED")


def apply_patch(item, data):
    for key, value in data.model_dump(
        exclude_unset=True
    ).items():
        setattr(item, key, value)


def audit(db, actor_id, action, item):
    record_action(
        db,
        user_id=actor_id,
        action=action,
        entity=f"{item.__table__.schema}.{item.__tablename__}",
        entity_id=item.id,
    )


def saved(db, item, schema):
    db.flush()
    return schema.model_validate(item)


def page(db, statement, pagination, schema):
    total = db.scalar(
        select(func.count()).select_from(
            statement.order_by(None).subquery()
        )
    )

    rows = db.scalars(
        statement.offset(
            (pagination.page - 1) * pagination.page_size
        ).limit(pagination.page_size)
    ).all()

    return Page[schema](
        items=[schema.model_validate(row) for row in rows],
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
    )


def visible_trips(actor_id):
    return (
        select(Trip.id)
        .join(TripMember, TripMember.trip_id == Trip.id)
        .join(GroupMember, GroupMember.group_id == Trip.group_id)
        .where(
            TripMember.user_id == actor_id,
            GroupMember.user_id == actor_id,
        )
    )


def utc_now():
    return datetime.now(timezone.utc).replace(tzinfo=None)