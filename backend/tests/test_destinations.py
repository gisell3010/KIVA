from app.schemas.destination import (
    DestinationCreate,
    DestinationSelection,
    DestinationUpdate,
)
from app.services import destination_service as service


def test_multiple_selected_destinations(
    db,
    scenario,
    destination,
    pagination,
):
    second = service.create_destination(
        db,
        actor_id=scenario.member.id,
        trip_id=scenario.trip.id,
        data=DestinationCreate(
            country="Francia",
            place_name="París",
        ),
    )

    for item in (destination, second):
        service.select_destination(
            db,
            actor_id=scenario.manager.id,
            trip_id=scenario.trip.id,
            destination_id=item.id,
            data=DestinationSelection(is_selected=True),
        )

    result = service.list_destinations(
        db,
        actor_id=scenario.member.id,
        trip_id=scenario.trip.id,
        pagination=pagination,
    )

    assert sum(item.is_selected for item in result.items) == 2


def test_member_cannot_select_destination(
    db,
    scenario,
    destination,
    expect_error,
):
    with expect_error(403):
        service.select_destination(
            db,
            actor_id=scenario.member.id,
            trip_id=scenario.trip.id,
            destination_id=destination.id,
            data=DestinationSelection(is_selected=True),
        )


def test_selected_destination_requires_manager_to_edit(
    db,
    scenario,
    destination,
    expect_error,
):
    service.select_destination(
        db,
        actor_id=scenario.owner.id,
        trip_id=scenario.trip.id,
        destination_id=destination.id,
        data=DestinationSelection(is_selected=True),
    )

    with expect_error(403):
        service.update_destination(
            db,
            actor_id=scenario.member.id,
            trip_id=scenario.trip.id,
            destination_id=destination.id,
            data=DestinationUpdate(place_name="Barcelona"),
        )