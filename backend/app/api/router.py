from fastapi import APIRouter

from app.api.endpoints import (
    activities,
    admin,
    auth,
    calendar,
    catalogs,
    dashboard,
    destinations,
    expenses,
    groups,
    health,
    notifications,
    polls,
    reservations,
    super_admin,
    support,
    trips,
    users,
)

router = APIRouter()

for module in (
    health,
    auth,
    users,
    groups,
    trips,
    destinations,
    activities,
    expenses,
    polls,
    reservations,
    catalogs,
    notifications,
    dashboard,
    calendar,
    admin,
    support,
    super_admin,
):
    router.include_router(module.router)