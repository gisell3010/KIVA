from app.schemas.activity import ActivityCreate
from app.services import (
    activity_service,
    calendar_service,
    dashboard_service,
)


def test_personal_dashboard_is_scoped(db, scenario):
    activity_service.create_activity(
        db,
        actor_id=scenario.member.id,
        trip_id=scenario.trip.id,
        data=ActivityCreate(
            title="Museo",
            activity_date=scenario.trip.start_date,
        ),
    )

    own = dashboard_service.get_dashboard(
        db,
        actor_id=scenario.member.id,
        today=scenario.trip.start_date,
    )

    other = dashboard_service.get_dashboard(
        db,
        actor_id=scenario.outsider.id,
        today=scenario.trip.start_date,
    )

    assert (
        own.groups_count,
        own.trips_count,
        own.upcoming_activities_count,
    ) == (1, 1, 1)

    assert (
        other.groups_count,
        other.trips_count,
        other.upcoming_activities_count,
    ) == (0, 0, 0)


def test_calendar_excludes_other_users_trips(
    db,
    scenario,
    expect_error,
):
    dates = dict(
        start_date=scenario.trip.start_date,
        end_date=scenario.trip.end_date,
    )

    own = calendar_service.list_events(
        db,
        actor_id=scenario.member.id,
        **dates,
    )

    other = calendar_service.list_events(
        db,
        actor_id=scenario.outsider.id,
        **dates,
    )

    assert len(own) == 2

    assert all(
        event.trip_id == scenario.trip.id
        for event in own
    )

    assert other == []

    with expect_error(404):
        calendar_service.list_events(
            db,
            actor_id=scenario.outsider.id,
            trip_id=scenario.trip.id,
            **dates,
        )