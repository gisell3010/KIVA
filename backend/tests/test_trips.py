from sqlalchemy import func, select

from app.models import TripMember
from app.schemas.activity import ActivityCreate
from app.schemas.common import OwnershipTransfer
from app.schemas.trip import (
    TripCreate,
    TripMemberAdd,
    TripUpdate,
)
from app.services import activity_service, poll_service
from app.services import trip_service as service


def test_create_trip_with_owner(db, scenario):
    trip = service.create_trip(
        db,
        actor_id=scenario.member.id,
        data=TripCreate(
            group_id=scenario.group.id,
            name="Otro viaje",
        ),
    )

    member = db.scalar(
        select(TripMember).where(
            TripMember.trip_id == trip.id
        )
    )

    assert member.user_id == scenario.member.id
    assert member.role == "OWNER"


def test_trip_member_must_belong_to_group(
    db,
    scenario,
    expect_error,
):
    with expect_error(404):
        service.add_member(
            db,
            actor_id=scenario.owner.id,
            trip_id=scenario.trip.id,
            data=TripMemberAdd(
                user_id=scenario.outsider.id
            ),
        )


def test_period_update_validates_existing_activities(
    db,
    scenario,
    expect_error,
):
    activity_service.create_activity(
        db,
        actor_id=scenario.member.id,
        trip_id=scenario.trip.id,
        data=ActivityCreate(
            title="Museo",
            activity_date=scenario.trip.end_date,
        ),
    )

    with expect_error(409, "ACTIVITY_DATES"):
        service.update_trip(
            db,
            actor_id=scenario.owner.id,
            trip_id=scenario.trip.id,
            data=TripUpdate(
                end_date=scenario.trip.start_date
            ),
        )

    with expect_error(422):
        service.update_trip(
            db,
            actor_id=scenario.owner.id,
            trip_id=scenario.trip.id,
            data=TripUpdate(start_date=None),
        )


def test_transfer_and_related_member_protection(
    db,
    scenario,
    destination,
    expect_error,
):
    with expect_error(409, "MEMBER_HAS_RECORDS"):
        service.remove_member(
            db,
            actor_id=scenario.owner.id,
            trip_id=scenario.trip.id,
            user_id=scenario.member.id,
        )

    service.transfer_ownership(
        db,
        actor_id=scenario.owner.id,
        trip_id=scenario.trip.id,
        data=OwnershipTransfer(
            new_owner_user_id=scenario.manager.id
        ),
    )

    assert db.scalar(
        select(func.count())
        .select_from(TripMember)
        .where(
            TripMember.trip_id == scenario.trip.id,
            TripMember.role == "OWNER",
        )
    ) == 1


def test_finishing_trip_closes_polls(db, scenario, poll):
    for status in ("CONFIRMED", "COMPLETED"):
        service.update_trip(
            db,
            actor_id=scenario.owner.id,
            trip_id=scenario.trip.id,
            data=TripUpdate(status=status),
        )

    result = poll_service.get_poll(
        db,
        actor_id=scenario.owner.id,
        trip_id=scenario.trip.id,
        poll_id=poll.id,
    )

    assert result.status == "CLOSED"