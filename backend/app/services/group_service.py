from sqlalchemy import func, select

from app.models.group import GroupMember, TravelGroup
from app.models.trip import Trip, TripMember
from app.models.user import User
from app.schemas.group import GroupMemberRead, GroupRead
from app.services.notification_service import create_notification
from app.services._shared import (
    active_user,
    allow,
    apply_patch,
    atomic,
    audit,
    fail,
    group_access,
    mapped_page,
    required,
    visible_trips,
)


def group_query(actor_id, *, all_trips=False):
    members_count = (
        select(func.count(GroupMember.id))
        .where(GroupMember.group_id == TravelGroup.id)
        .correlate(TravelGroup)
        .scalar_subquery()
    )

    my_role = (
        select(GroupMember.role)
        .where(
            GroupMember.group_id == TravelGroup.id,
            GroupMember.user_id == actor_id,
        )
        .correlate(TravelGroup)
        .scalar_subquery()
    )

    trips_count = select(func.count(Trip.id)).where(
        Trip.group_id == TravelGroup.id
    )

    if not all_trips:
        trips_count = trips_count.where(
            Trip.id.in_(visible_trips(actor_id))
        )

    return select(
        TravelGroup.id,
        TravelGroup.name,
        TravelGroup.description,
        TravelGroup.created_at,
        my_role.label("my_role"),
        members_count.label("members_count"),
        trips_count
        .correlate(TravelGroup)
        .scalar_subquery()
        .label("trips_count"),
    )


def _member_query():
    return select(
        GroupMember.id,
        GroupMember.group_id,
        GroupMember.user_id,
        GroupMember.role,
        GroupMember.joined_at,
        User.full_name,
        User.username,
        User.profile_image,
    ).join(User, User.id == GroupMember.user_id)


def _read_group(db, actor_id, group_id):
    row = db.execute(
        group_query(actor_id).where(
            TravelGroup.id == group_id
        )
    ).mappings().one_or_none()

    if row is None:
        fail("Grupo no disponible.", "NOT_FOUND", 404)

    return GroupRead.model_validate(row)


def _read_member(db, member_id):
    row = db.execute(
        _member_query().where(
            GroupMember.id == member_id
        )
    ).mappings().one()

    return GroupMemberRead.model_validate(row)


def list_groups(db, *, actor_id, pagination):
    active_user(db, actor_id)

    group_ids = select(GroupMember.group_id).where(
        GroupMember.user_id == actor_id
    )

    statement = (
        group_query(actor_id)
        .where(TravelGroup.id.in_(group_ids))
        .order_by(
            TravelGroup.created_at.desc(),
            TravelGroup.id.desc(),
        )
    )

    return mapped_page(
        db,
        statement,
        pagination,
        GroupRead,
    )


def get_group(db, *, actor_id, group_id):
    group_access(db, actor_id, group_id)
    return _read_group(db, actor_id, group_id)


@atomic
def create_group(db, *, actor_id, data):
    active_user(db, actor_id)

    group = TravelGroup(**data.model_dump())
    db.add(group)
    db.flush()

    db.add(
        GroupMember(
            group_id=group.id,
            user_id=actor_id,
            role="OWNER",
        )
    )

    audit(db, actor_id, "GROUP_CREATE", group)

    db.flush()
    return _read_group(db, actor_id, group.id)


@atomic
def update_group(db, *, actor_id, group_id, data):
    group, member = group_access(
        db,
        actor_id,
        group_id,
        lock=True,
    )

    allow(member.role, {"OWNER"})
    apply_patch(group, data)
    audit(db, actor_id, "GROUP_UPDATE", group)

    db.flush()
    return _read_group(db, actor_id, group.id)


def list_members(db, *, actor_id, group_id, pagination):
    group_access(db, actor_id, group_id)

    return mapped_page(
        db,
        _member_query()
        .where(GroupMember.group_id == group_id)
        .order_by(GroupMember.id),
        pagination,
        GroupMemberRead,
    )


@atomic
def add_member(db, *, actor_id, group_id, data):
    group, member = group_access(
        db,
        actor_id,
        group_id,
        lock=True,
    )

    allow(member.role, {"OWNER"})
    active_user(db, data.user_id)

    if db.scalar(
        select(GroupMember.id).where(
            GroupMember.group_id == group_id,
            GroupMember.user_id == data.user_id,
        )
    ):
        fail(
            "El usuario ya pertenece al grupo.",
            "MEMBER_EXISTS",
        )

    new_member = GroupMember(
        group_id=group_id,
        user_id=data.user_id,
        role="MEMBER",
    )

    db.add(new_member)
    db.flush()

    result = _read_member(db, new_member.id)

    create_notification(
        db,
        user_id=data.user_id,
        title="Nuevo grupo",
        message=f"Te agregaron al grupo {group.name}.",
    )

    audit(db, actor_id, "GROUP_MEMBER_ADD", new_member)

    return result


@atomic
def remove_member(db, *, actor_id, group_id, user_id):
    _, actor = group_access(
        db,
        actor_id,
        group_id,
        lock=True,
    )

    if actor_id != user_id:
        allow(actor.role, {"OWNER"})

    member = required(
        db,
        select(GroupMember).where(
            GroupMember.group_id == group_id,
            GroupMember.user_id == user_id,
        ),
    )

    if member.role == "OWNER":
        fail(
            "Transfiere la propiedad antes de salir.",
            "OWNER_REQUIRED",
        )

    if db.scalar(
        select(TripMember.id)
        .join(Trip)
        .where(
            Trip.group_id == group_id,
            TripMember.user_id == user_id,
        )
        .limit(1)
    ):
        fail(
            "Primero retira al participante de los viajes.",
            "MEMBER_HAS_TRIPS",
        )

    audit(db, actor_id, "GROUP_MEMBER_REMOVE", member)
    db.delete(member)


@atomic
def transfer_ownership(db, *, actor_id, group_id, data):
    group, owner = group_access(
        db,
        actor_id,
        group_id,
        lock=True,
    )

    allow(owner.role, {"OWNER"})
    active_user(db, data.new_owner_user_id)

    successor = required(
        db,
        select(GroupMember).where(
            GroupMember.group_id == group_id,
            GroupMember.user_id == data.new_owner_user_id,
        ),
    )

    if successor.id != owner.id:
        owner.role = "MEMBER"
        successor.role = "OWNER"
        audit(db, actor_id, "GROUP_OWNER_CHANGE", group)

    db.flush()
    return _read_member(db, successor.id)


@atomic
def delete_group(db, *, actor_id, group_id):
    group, member = group_access(
        db,
        actor_id,
        group_id,
        lock=True,
    )

    allow(member.role, {"OWNER"})

    if db.scalar(
        select(Trip.id)
        .where(Trip.group_id == group_id)
        .limit(1)
    ):
        fail(
            "El grupo todavía contiene viajes.",
            "GROUP_HAS_TRIPS",
        )

    audit(db, actor_id, "GROUP_DELETE", group)
    db.delete(group)