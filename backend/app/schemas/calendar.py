from datetime import date
from typing import Literal

from pydantic import model_validator

from app.schemas.common import Id, LocalTime, Schema, UTCDateTime


class CalendarEventRead(Schema):
    trip_id: Id
    source_type: Literal[
        "TRIP", "ACTIVITY", "RESERVATION", "POLL", "EXPENSE"
    ]
    source_id: Id
    title: str
    event_date: date | None = None
    start_time: LocalTime | None = None
    deadline_at: UTCDateTime | None = None

    @model_validator(mode="after")
    def validate_schedule(self):
        if self.event_date is None and self.deadline_at is None:
            raise ValueError("El evento requiere fecha o fecha límite.")

        if self.start_time is not None and self.event_date is None:
            raise ValueError("Una hora local requiere una fecha.")

        return self