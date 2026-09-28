from datetime import timedelta

from app.models import Poll
from app.schemas.poll import (
    PollCreate,
    PollOptionUpdate,
    PollVoteRequest,
)
from app.services import poll_service as service
from app.services._shared import utc_now


def test_multiple_votes_are_idempotent_and_can_be_removed(
    db,
    scenario,
    poll,
):
    args = dict(
        actor_id=scenario.member.id,
        trip_id=scenario.trip.id,
        poll_id=poll.id,
    )

    data = PollVoteRequest(
        option_ids=[
            option.id
            for option in poll.options[:2]
        ]
    )

    service.set_votes(db, **args, data=data)
    service.set_votes(db, **args, data=data)

    result = service.get_results(db, **args)

    assert result.total_votes == 2
    assert result.total_voters == 1

    assert sum(
        option.selected_by_me
        for option in result.options
    ) == 2

    service.set_votes(
        db,
        **args,
        data=PollVoteRequest(option_ids=[]),
    )

    result = service.get_results(db, **args)

    assert result.total_votes == 0
    assert result.total_voters == 0


def test_foreign_option_rejected(
    db,
    scenario,
    poll,
    expect_error,
):
    other = service.create_poll(
        db,
        actor_id=scenario.owner.id,
        trip_id=scenario.trip.id,
        data=PollCreate(
            question="Otra encuesta",
            options=[
                {"option_text": "Sí"},
                {"option_text": "No"},
            ],
        ),
    )

    with expect_error(422, "INVALID_OPTIONS"):
        service.set_votes(
            db,
            actor_id=scenario.member.id,
            trip_id=scenario.trip.id,
            poll_id=poll.id,
            data=PollVoteRequest(
                option_ids=[other.options[0].id]
            ),
        )


def test_options_with_votes_cannot_change(
    db,
    scenario,
    poll,
    expect_error,
):
    service.set_votes(
        db,
        actor_id=scenario.member.id,
        trip_id=scenario.trip.id,
        poll_id=poll.id,
        data=PollVoteRequest(
            option_ids=[poll.options[0].id]
        ),
    )

    with expect_error(409, "POLL_HAS_VOTES"):
        service.update_option(
            db,
            actor_id=scenario.owner.id,
            trip_id=scenario.trip.id,
            poll_id=poll.id,
            option_id=poll.options[0].id,
            data=PollOptionUpdate(
                option_text="Otro lugar"
            ),
        )


def test_closed_poll_rejects_votes(
    db,
    scenario,
    poll,
    expect_error,
):
    service.close_poll(
        db,
        actor_id=scenario.owner.id,
        trip_id=scenario.trip.id,
        poll_id=poll.id,
    )

    with expect_error(409, "POLL_CLOSED"):
        service.set_votes(
            db,
            actor_id=scenario.member.id,
            trip_id=scenario.trip.id,
            poll_id=poll.id,
            data=PollVoteRequest(
                option_ids=[poll.options[0].id]
            ),
        )


def test_expired_poll_rejects_votes(
    db,
    scenario,
    poll,
    expect_error,
):
    db.get(Poll, poll.id).closes_at = (
        utc_now() - timedelta(seconds=1)
    )

    db.commit()

    with expect_error(409, "POLL_CLOSED"):
        service.set_votes(
            db,
            actor_id=scenario.member.id,
            trip_id=scenario.trip.id,
            poll_id=poll.id,
            data=PollVoteRequest(
                option_ids=[poll.options[0].id]
            ),
        )