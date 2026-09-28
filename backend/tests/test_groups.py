from sqlalchemy import func, select

from app.models import GroupMember
from app.schemas.common import OwnershipTransfer
from app.schemas.group import GroupCreate, GroupMemberAdd
from app.services import group_service as service


def test_create_group_with_owner(db, make_user):
    user = make_user()

    group = service.create_group(
        db,
        actor_id=user.id,
        data=GroupCreate(name="Familia"),
    )

    member = db.scalar(
        select(GroupMember).where(
            GroupMember.group_id == group.id
        )
    )

    assert member.user_id == user.id
    assert member.role == "OWNER"


def test_duplicate_member_and_owner_exit_are_blocked(
    db,
    scenario,
    expect_error,
):
    with expect_error(409):
        service.add_member(
            db,
            actor_id=scenario.owner.id,
            group_id=scenario.group.id,
            data=GroupMemberAdd(user_id=scenario.member.id),
        )

    with expect_error(409):
        service.remove_member(
            db,
            actor_id=scenario.owner.id,
            group_id=scenario.group.id,
            user_id=scenario.owner.id,
        )


def test_transfer_leaves_one_owner(db, scenario):
    service.transfer_ownership(
        db,
        actor_id=scenario.owner.id,
        group_id=scenario.group.id,
        data=OwnershipTransfer(
            new_owner_user_id=scenario.member.id
        ),
    )

    count = db.scalar(
        select(func.count())
        .select_from(GroupMember)
        .where(
            GroupMember.group_id == scenario.group.id,
            GroupMember.role == "OWNER",
        )
    )

    assert count == 1


def test_member_in_trip_cannot_leave_group(
    db,
    scenario,
    expect_error,
):
    with expect_error(409, "MEMBER_HAS_TRIPS"):
        service.remove_member(
            db,
            actor_id=scenario.owner.id,
            group_id=scenario.group.id,
            user_id=scenario.member.id,
        )