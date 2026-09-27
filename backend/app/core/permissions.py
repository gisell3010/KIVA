from collections.abc import Collection
from typing import Literal

from app.core.exceptions import AppError

GlobalRole = Literal["SUPER_ADMIN", "ADMIN", "SUPPORT", "USER"]
GroupRole = Literal["OWNER", "MEMBER"]
TripRole = Literal["OWNER", "ORGANIZER", "MEMBER"]

def require_global_role(
    role: GlobalRole,
    allowed: Collection[GlobalRole],
) -> None:
    if role not in allowed:
        raise AppError(
            "No tienes permiso para esta operación.",
            status_code=403,
            code="FORBIDDEN",
        )


def require_group_role(
    role: GroupRole | None,
    allowed: Collection[GroupRole],
) -> None:
    if role is None or role not in allowed:
        raise AppError(
            "No tienes permiso en este grupo.",
            status_code=403,
            code="GROUP_FORBIDDEN",
        )


def require_trip_role(
    role: TripRole | None,
    allowed: Collection[TripRole],
) -> None:
    if role is None or role not in allowed:
        raise AppError(
            "No tienes permiso en este viaje.",
            status_code=403,
            code="TRIP_FORBIDDEN",
        )