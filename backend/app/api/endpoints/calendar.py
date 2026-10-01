from datetime import date
from typing import Annotated

from fastapi import APIRouter, Query

from app.api.dependencies import CurrentUser, DbSession
from app.schemas.calendar import CalendarEventRead
from app.services import calendar_service

router = APIRouter(prefix="/calendar", tags=["Calendario"])


@router.get("", response_model=list[CalendarEventRead])
def list_events(
    start_date: date,
    end_date: date,
    db: DbSession,
    user: CurrentUser,
    trip_id: Annotated[
        int | None,
        Query(gt=0, le=2_147_483_647),
    ] = None,
):
    return calendar_service.list_events(
        db,
        actor_id=user.id,
        start_date=start_date,
        end_date=end_date,
        trip_id=trip_id,
    )