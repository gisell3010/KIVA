from datetime import date
from typing import Annotated, Literal

from pydantic import Field, SecretStr, model_validator

from app.schemas.common import (
    Email,
    Id,
    NonEmptyText,
    Schema,
    UTCDateTime,
)
from app.schemas.user import GlobalRole, UserStatus

SupportCategory = Literal[
    "ACCESS",
    "ACCOUNT",
    "TRIP",
    "EXPENSE",
    "VOTING",
    "RESERVATION",
    "TECHNICAL",
    "OTHER",
]

SupportStatus = Literal[
    "OPEN",
    "IN_REVIEW",
    "ESCALATED",
    "RESOLVED",
    "CLOSED",
]


class SupportReportCreate(Schema):
    trip_id: Id | None = None
    category: SupportCategory
    subject: Annotated[NonEmptyText, Field(max_length=150)]
    description: Annotated[NonEmptyText, Field(max_length=1000)]


class PublicSupportReportCreate(Schema):
    contact_email: Email
    category: Literal["ACCESS", "ACCOUNT", "TECHNICAL", "OTHER"]
    subject: Annotated[NonEmptyText, Field(max_length=150)]
    description: Annotated[NonEmptyText, Field(max_length=1000)]


class SupportReportUpdate(Schema):
    status: SupportStatus | None = None
    response: Annotated[NonEmptyText, Field(max_length=1000)] | None = None

    @model_validator(mode="after")
    def validate_update(self):
        if self.status is None and self.response is None:
            raise ValueError("Envía una respuesta o un nuevo estado.")
        return self


class SupportReportRead(Schema):
    id: Id
    reported_by_user_id: Id | None
    assigned_to_user_id: Id | None
    trip_id: Id | None
    contact_email: Email
    category: SupportCategory
    subject: str
    description: str
    status: SupportStatus
    response: str | None
    created_at: UTCDateTime
    updated_at: UTCDateTime
    resolved_at: UTCDateTime | None


class SupportReporterRead(Schema):
    id: Id
    full_name: str
    username: str
    email: Email
    role: GlobalRole
    status: UserStatus


class SupportTripRead(Schema):
    id: Id
    group_id: Id
    name: str
    status: str
    start_date: date | None
    end_date: date | None


class SupportReportDetail(SupportReportRead):
    reporter: SupportReporterRead | None = None
    assignee: SupportReporterRead | None = None
    trip: SupportTripRead | None = None


class SupportDashboardRead(Schema):
    open_reports_count: int = Field(ge=0)
    in_review_reports_count: int = Field(ge=0)
    escalated_reports_count: int = Field(ge=0)
    resolved_reports_count: int = Field(ge=0)
    unassigned_reports_count: int = Field(ge=0)


class SupportMessageCreate(Schema):
    body: Annotated[NonEmptyText, Field(max_length=1000)]
    is_internal: bool = False


class SupportMessageRead(Schema):
    id: Id
    author_id: Id | None
    author_label: str
    body: str
    is_internal: bool
    created_at: UTCDateTime


class SupportEscalate(Schema):
    reason: Annotated[NonEmptyText, Field(min_length=10, max_length=900)]


class SupportAssign(Schema):
    user_id: Id


class PublicSupportReceipt(SupportReportRead):
    tracking_token: str


class PublicSupportAccess(Schema):
    report_id: Id
    tracking_token: Annotated[SecretStr, Field(min_length=32, max_length=100)]


class PublicSupportReply(PublicSupportAccess):
    body: Annotated[NonEmptyText, Field(max_length=1000)]
