from sqlalchemy import select

from app.models.group import GroupMember, TravelGroup
from app.models.trip import Trip, TripMember
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
    page,
    required,
    saved,
)


def list_groups(db, *, actor_id, pagination):
    active_user(db, actor_id)

    statement = (
        select(TravelGroup)
        .join(GroupMember)
        .where(GroupMember.user_id == actor_id)
        .order_by(TravelGroup.id.desc())
    )

    return page(db, statement, pagination, GroupRead)


def get_group(db, *, actor_id, group_id):
    group, _ = group_access(db, actor_id, group_id)
    return GroupRead.model_validate(group)


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

    return saved(db, group, GroupRead)


@atomic
def update_group(db, *, actor_id, group_id, data):
    group, member = group_access(
        db, actor_id, group_id, lock=True
    )

    allow(member.role, {"OWNER"})
    apply_patch(group, data)
    audit(db, actor_id, "GROUP_UPDATE", group)

    return saved(db, group, GroupRead)


def list_members(db, *, actor_id, group_id, pagination):
    group_access(db, actor_id, group_id)

    return page(
        db,
        select(GroupMember)
        .where(GroupMember.group_id == group_id)
        .order_by(GroupMember.id),
        pagination,
        GroupMemberRead,
    )


@atomic
def add_member(db, *, actor_id, group_id, data):
    group, member = group_access(
        db, actor_id, group_id, lock=True
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
    result = saved(db, new_member, GroupMemberRead)

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
        db, actor_id, group_id, lock=True
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
        db, actor_id, group_id, lock=True
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

    return saved(db, successor, GroupMemberRead)


@atomic
def delete_group(db, *, actor_id, group_id):
    group, member = group_access(
        db, actor_id, group_id, lock=True
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