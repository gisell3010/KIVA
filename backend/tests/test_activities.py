from datetime import timedelta

from app.schemas.activity import ActivityCreate, ActivityUpdate
from app.services import activity_service as service


def test_activity_must_be_inside_trip_period(
    db,
    scenario,
    expect_error,
):
    with expect_error(422, "INVALID_DATE"):
        service.create_activity(
            db,
            actor_id=scenario.member.id,
            trip_id=scenario.trip.id,
            data=ActivityCreate(
                title="Museo",
                activity_date=(
                    scenario.trip.end_date
                    + timedelta(days=1)
                ),
            ),
        )


def test_member_proposes_and_manager_approves(
    db,
    scenario,
    expect_error,
):
    item = service.create_activity(
        db,
        actor_id=scenario.member.id,
        trip_id=scenario.trip.id,
        data=ActivityCreate(
            title="Museo",
            activity_date=scenario.trip.start_date,
        ),
    )

    assert item.status == "PROPOSED"

    args = dict(
        trip_id=scenario.trip.id,
        activity_id=item.id,
        data=ActivityUpdate(status="APPROVED"),
    )

    with expect_error(403):
        service.update_activity(
            db,
            actor_id=scenario.member.id,
            **args,
        )

    result = service.update_activity(
        db,
        actor_id=scenario.manager.id,
        **args,
    )

    assert result.status == "APPROVED"