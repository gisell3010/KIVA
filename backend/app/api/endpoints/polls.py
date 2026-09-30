from fastapi import APIRouter, Response

from app.api.dependencies import (
    CurrentUser,
    DbSession,
    Pagination,
    PathId,
)
from app.schemas.common import Page
from app.schemas.poll import (
    PollCreate,
    PollDetail,
    PollOptionCreate,
    PollOptionRead,
    PollOptionUpdate,
    PollRead,
    PollResults,
    PollUpdate,
    PollVoteRequest,
    VoteRead,
)
from app.services import poll_service

router = APIRouter(
    prefix="/trips/{trip_id}/polls",
    tags=["Votaciones"],
)


@router.get("", response_model=Page[PollRead])
def list_polls(
    trip_id: PathId,
    db: DbSession,
    user: CurrentUser,
    pagination: Pagination,
):
    return poll_service.list_polls(
        db,
        actor_id=user.id,
        trip_id=trip_id,
        pagination=pagination,
    )


@router.post(
    "",
    response_model=PollDetail,
    status_code=201,
)
def create_poll(
    trip_id: PathId,
    data: PollCreate,
    db: DbSession,
    user: CurrentUser,
):
    return poll_service.create_poll(
        db,
        actor_id=user.id,
        trip_id=trip_id,
        data=data,
    )


@router.get("/{poll_id}", response_model=PollDetail)
def get_poll(
    trip_id: PathId,
    poll_id: PathId,
    db: DbSession,
    user: CurrentUser,
):
    return poll_service.get_poll(
        db,
        actor_id=user.id,
        trip_id=trip_id,
        poll_id=poll_id,
    )


@router.patch("/{poll_id}", response_model=PollDetail)
def update_poll(
    trip_id: PathId,
    poll_id: PathId,
    data: PollUpdate,
    db: DbSession,
    user: CurrentUser,
):
    return poll_service.update_poll(
        db,
        actor_id=user.id,
        trip_id=trip_id,
        poll_id=poll_id,
        data=data,
    )


@router.delete("/{poll_id}", status_code=204)
def delete_poll(
    trip_id: PathId,
    poll_id: PathId,
    db: DbSession,
    user: CurrentUser,
):
    poll_service.delete_poll(
        db,
        actor_id=user.id,
        trip_id=trip_id,
        poll_id=poll_id,
    )

    return Response(status_code=204)


@router.post("/{poll_id}/close", response_model=PollRead)
def close_poll(
    trip_id: PathId,
    poll_id: PathId,
    db: DbSession,
    user: CurrentUser,
):
    return poll_service.close_poll(
        db,
        actor_id=user.id,
        trip_id=trip_id,
        poll_id=poll_id,
    )


@router.post(
    "/{poll_id}/options",
    response_model=PollOptionRead,
    status_code=201,
)
def add_option(
    trip_id: PathId,
    poll_id: PathId,
    data: PollOptionCreate,
    db: DbSession,
    user: CurrentUser,
):
    return poll_service.add_option(
        db,
        actor_id=user.id,
        trip_id=trip_id,
        poll_id=poll_id,
        data=data,
    )


@router.patch(
    "/{poll_id}/options/{option_id}",
    response_model=PollOptionRead,
)
def update_option(
    trip_id: PathId,
    poll_id: PathId,
    option_id: PathId,
    data: PollOptionUpdate,
    db: DbSession,
    user: CurrentUser,
):
    return poll_service.update_option(
        db,
        actor_id=user.id,
        trip_id=trip_id,
        poll_id=poll_id,
        option_id=option_id,
        data=data,
    )


@router.delete(
    "/{poll_id}/options/{option_id}",
    status_code=204,
)
def delete_option(
    trip_id: PathId,
    poll_id: PathId,
    option_id: PathId,
    db: DbSession,
    user: CurrentUser,
):
    poll_service.delete_option(
        db,
        actor_id=user.id,
        trip_id=trip_id,
        poll_id=poll_id,
        option_id=option_id,
    )

    return Response(status_code=204)


@router.put(
    "/{poll_id}/votes",
    response_model=list[VoteRead],
)
def set_votes(
    trip_id: PathId,
    poll_id: PathId,
    data: PollVoteRequest,
    db: DbSession,
    user: CurrentUser,
):
    return poll_service.set_votes(
        db,
        actor_id=user.id,
        trip_id=trip_id,
        poll_id=poll_id,
        data=data,
    )


@router.get("/{poll_id}/results", response_model=PollResults)
def get_results(
    trip_id: PathId,
    poll_id: PathId,
    db: DbSession,
    user: CurrentUser,
):
    return poll_service.get_results(
        db,
        actor_id=user.id,
        trip_id=trip_id,
        poll_id=poll_id,
    )