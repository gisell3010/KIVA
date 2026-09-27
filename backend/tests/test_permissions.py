import pytest

from app.core.permissions import (
    require_global_role,
    require_group_role,
    require_trip_role,
)
from app.services import group_service, trip_service


@pytest.mark.parametrize(
    "check,role,allowed",
    [
        (
            require_global_role,
            "SUPPORT",
            ("ADMIN", "SUPER_ADMIN"),
        ),
        (
            require_group_role,
            "MEMBER",
            ("OWNER",),
        ),
        (
            require_trip_role,
            "MEMBER",
            ("OWNER", "ORGANIZER"),
        ),
        (
            require_trip_role,
            None,
            ("OWNER",),
        ),
    ],
)
def test_roles_reject_unauthorized_access(
    check,
    role,
    allowed,
    expect_error,
):
    with expect_error(403):
        check(role, allowed)


def test_superadmin_has_no_automatic_private_access(
    db,
    scenario,
    expect_error,
):
    with expect_error(404):
        group_service.get_group(
            db,
            actor_id=scenario.superadmin.id,
            group_id=scenario.group.id,
        )

    with expect_error(404):
        trip_service.get_trip(
            db,
            actor_id=scenario.superadmin.id,
            trip_id=scenario.trip.id,
        )