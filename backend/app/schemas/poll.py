from typing import Annotated, Literal

from pydantic import AwareDatetime, Field, field_validator

from app.schemas.common import (
    Id,
    NonEmptyText,
    PatchSchema,
    Schema,
    UTCDateTime,
    validate_unique_ids,
)

PollStatus = Literal["OPEN", "CLOSED"]
Question = Annotated[NonEmptyText, Field(max_length=250)]
OptionText = Annotated[NonEmptyText, Field(max_length=200)]


class PollOptionCreate(Schema):
    option_text: OptionText


class PollCreate(Schema):
    question: Question
    closes_at: AwareDatetime | None = None
    options: list[PollOptionCreate] = Field(min_length=2)

    @field_validator("options")
    @classmethod
    def validate_options(cls, values):
        texts = [option.option_text.casefold() for option in values]

        if len(texts) != len(set(texts)):
            raise ValueError("Las opciones no deben repetirse.")

        return values


class PollUpdate(PatchSchema):
    nullable_fields = frozenset({"closes_at"})

    question: Question | None = None
    closes_at: AwareDatetime | None = None


class PollOptionUpdate(PatchSchema):
    option_text: OptionText | None = None
    option_number: Id | None = None


class PollRead(Schema):
    id: Id
    trip_id: Id
    question: str
    status: PollStatus
    closes_at: UTCDateTime | None


class PollOptionRead(Schema):
    id: Id
    poll_id: Id
    option_number: Id
    option_text: str


class PollDetail(PollRead):
    options: list[PollOptionRead]


class PollVoteRequest(Schema):
    option_ids: list[Id]

    @field_validator("option_ids")
    @classmethod
    def validate_options(cls, values):
        return validate_unique_ids(values)


class VoteRead(Schema):
    id: Id
    user_id: Id
    option_id: Id
    voted_at: UTCDateTime


class PollOptionResult(PollOptionRead):
    votes_count: int = Field(ge=0)
    selected_by_me: bool


class PollResults(Schema):
    poll_id: Id
    total_voters: int = Field(ge=0)
    total_votes: int = Field(ge=0)
    options: list[PollOptionResult]