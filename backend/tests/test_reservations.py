import pytest

from app.schemas.reservation import (
    ReservationCreate,
    ReservationUpdate,
)
from app.services import reservation_service as service


@pytest.fixture
def reservation_data(scenario):
    return ReservationCreate(
        type_id=scenario.reservation_type.id,
        title="Hotel de prueba",
        reservation_date=scenario.trip.start_date,
        amount="100000.00",
    )


def test_member_cannot_create_reservations(
    db,
    scenario,
    reservation_data,
    expect_error,
):
    with expect_error(403):
        service.create_reservation(
            db,
            actor_id=scenario.member.id,
            trip_id=scenario.trip.id,
            data=reservation_data,
        )


def test_reservation_state_transitions(
    db,
    scenario,
    reservation_data,
    expect_error,
):
    item = service.create_reservation(
        db,
        actor_id=scenario.manager.id,
        trip_id=scenario.trip.id,
        data=reservation_data,
    )

    assert item.status == "PENDING"

    args = dict(
        actor_id=scenario.manager.id,
        trip_id=scenario.trip.id,
        reservation_id=item.id,
    )

    for status in ("CONFIRMED", "CANCELLED"):
        result = service.update_reservation(
            db,
            **args,
            data=ReservationUpdate(status=status),
        )

        assert result.status == status

    with expect_error(409, "INVALID_STATUS"):
        service.update_reservation(
            db,
            **args,
            data=ReservationUpdate(status="CONFIRMED"),
        )