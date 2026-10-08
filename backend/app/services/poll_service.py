from datetime import timezone

from sqlalchemy import func, select

from app.models.poll import Poll, PollOption, Vote
from app.services.notification_service import notify_trip_members
from app.schemas.poll import (
    PollDetail,
    PollOptionRead,
    PollOptionResult,
    PollRead,
    PollResults,
    VoteRead,
)
from app.services._shared import (
    MANAGERS,
    allow,
    atomic,
    audit,
    editable,
    fail,
    page,
    required,
    saved,
    trip_access,
    trip_item,
    utc_now,
)


def _options(db, poll_id):
    return list(
        db.scalars(
            select(PollOption)
            .where(PollOption.poll_id == poll_id)
            .order_by(
                PollOption.option_number,
                PollOption.id,
            )
        )
    )


def _detail(db, poll):
    return PollDetail(
        **PollRead.model_validate(poll).model_dump(),
        options=[
            PollOptionRead.model_validate(option)
            for option in _options(db, poll.id)
        ],
    )


def _open(poll):
    if poll.status != "OPEN" or (
        poll.closes_at is not None
        and poll.closes_at <= utc_now()
    ):
        fail(
            "La encuesta está cerrada o vencida.",
            "POLL_CLOSED",
        )


def _deadline(value):
    if value is None:
        return None

    value = value.astimezone(timezone.utc)

    if value <= utc_now():
        fail(
            "La fecha de cierre debe ser futura.",
            "INVALID_DEADLINE",
            422,
        )

    return value


def _without_votes(db, poll_id):
    if db.scalar(
        select(Vote.id)
        .join(PollOption)
        .where(PollOption.poll_id == poll_id)
        .limit(1)
    ):
        fail(
            "La encuesta ya tiene votos; "
            "sus opciones y pregunta no pueden cambiar.",
            "POLL_HAS_VOTES",
        )


def _managed(db, actor_id, trip_id, poll_id):
    trip, member, poll = trip_item(
        db,
        actor_id,
        trip_id,
        Poll,
        poll_id,
        lock=True,
    )

    allow(member.role, MANAGERS)
    editable(trip)

    return poll


def list_polls(db, *, actor_id, trip_id, pagination):
    trip_access(db, actor_id, trip_id)

    return page(
        db,
        select(Poll)
        .where(Poll.trip_id == trip_id)
        .order_by(Poll.id.desc()),
        pagination,
        PollRead,
    )


def get_poll(db, *, actor_id, trip_id, poll_id):
    _, _, poll = trip_item(
        db, actor_id, trip_id, Poll, poll_id
    )

    return _detail(db, poll)


@atomic
def create_poll(db, *, actor_id, trip_id, data):
    trip, member = trip_access(
        db, actor_id, trip_id, lock=True
    )

    allow(member.role, MANAGERS)
    editable(trip)

    poll = Poll(
        trip_id=trip_id,
        question=data.question,
        status="OPEN",
        closes_at=_deadline(data.closes_at),
    )

    db.add(poll)
    db.flush()

    db.add_all(
        [
            PollOption(
                poll_id=poll.id,
                option_number=index,
                option_text=option.option_text,
            )
            for index, option in enumerate(data.options, 1)
        ]
    )

    db.flush()

    notify_trip_members(
        db,
        action_path=f"/votaciones?trip={trip_id}",
        trip_id=trip_id,
        title="Nueva votación",
        message=f'Hay una nueva votación en {trip.name}: "{poll.question}".',
        exclude_user_id=actor_id,
    )

    audit(db, actor_id, "POLL_CREATE", poll)

    return _detail(db, poll)


@atomic
def update_poll(db, *, actor_id, trip_id, poll_id, data):
    poll = _managed(db, actor_id, trip_id, poll_id)
    _open(poll)

    if "question" in data.model_fields_set:
        _without_votes(db, poll_id)
        poll.question = data.question

    if "closes_at" in data.model_fields_set:
        poll.closes_at = _deadline(data.closes_at)

    audit(db, actor_id, "POLL_UPDATE", poll)
    db.flush()

    return _detail(db, poll)


@atomic
def close_poll(db, *, actor_id, trip_id, poll_id):
    poll = _managed(db, actor_id, trip_id, poll_id)
    poll.status = "CLOSED"

    notify_trip_members(
        db,
        action_path=f"/votaciones?trip={trip_id}",
        trip_id=trip_id,
        title="Votación finalizada",
        message=f'Ya puedes consultar los resultados de "{poll.question}".',
        exclude_user_id=actor_id,
    )

    audit(db, actor_id, "POLL_CLOSE", poll)

    return saved(db, poll, PollRead)


@atomic
def add_option(db, *, actor_id, trip_id, poll_id, data):
    poll = _managed(db, actor_id, trip_id, poll_id)
    _open(poll)
    _without_votes(db, poll_id)

    options = _options(db, poll_id)

    if any(
        option.option_text.casefold() == data.option_text.casefold()
        for option in options
    ):
        fail("La opción ya existe.", "OPTION_EXISTS")

    number = max(
        (option.option_number for option in options),
        default=0,
    ) + 1

    if number > 2_147_483_647:
        fail(
            "Se alcanzó el límite de numeración.",
            "OPTION_NUMBER",
        )

    option = PollOption(
        poll_id=poll_id,
        option_number=number,
        option_text=data.option_text,
    )

    db.add(option)
    result = saved(db, option, PollOptionRead)
    audit(db, actor_id, "POLL_OPTION_CREATE", option)

    return result


@atomic
def update_option(
    db,
    *,
    actor_id,
    trip_id,
    poll_id,
    option_id,
    data,
):
    poll = _managed(db, actor_id, trip_id, poll_id)
    _open(poll)
    _without_votes(db, poll_id)

    option = required(
        db,
        select(PollOption).where(
            PollOption.id == option_id,
            PollOption.poll_id == poll_id,
        ),
    )

    changes = data.model_dump(exclude_unset=True)
    text = changes.get("option_text", option.option_text)
    number = changes.get("option_number", option.option_number)

    if any(
        other.id != option_id
        and (
            other.option_text.casefold() == text.casefold()
            or other.option_number == number
        )
        for other in _options(db, poll_id)
    ):
        fail(
            "El texto o número de opción ya existe.",
            "OPTION_EXISTS",
        )

    option.option_text = text
    option.option_number = number

    audit(db, actor_id, "POLL_OPTION_UPDATE", option)

    return saved(db, option, PollOptionRead)


@atomic
def delete_option(
    db,
    *,
    actor_id,
    trip_id,
    poll_id,
    option_id,
):
    poll = _managed(db, actor_id, trip_id, poll_id)
    _open(poll)
    _without_votes(db, poll_id)

    option = required(
        db,
        select(PollOption).where(
            PollOption.id == option_id,
            PollOption.poll_id == poll_id,
        ),
    )

    if len(_options(db, poll_id)) <= 2:
        fail(
            "La encuesta debe conservar al menos dos opciones.",
            "MIN_OPTIONS",
        )

    audit(db, actor_id, "POLL_OPTION_DELETE", option)
    db.delete(option)


@atomic
def set_votes(db, *, actor_id, trip_id, poll_id, data):
    trip, _, poll = trip_item(
        db,
        actor_id,
        trip_id,
        Poll,
        poll_id,
        lock=True,
    )

    editable(trip)
    _open(poll)

    valid_ids = {
        option.id
        for option in _options(db, poll_id)
    }

    selected = set(data.option_ids)

    if not selected <= valid_ids:
        fail(
            "Todas las opciones deben pertenecer a esta encuesta.",
            "INVALID_OPTIONS",
            422,
        )

    existing = list(
        db.scalars(
            select(Vote).where(
                Vote.user_id == actor_id,
                Vote.option_id.in_(valid_ids),
            )
        )
    )

    current = {vote.option_id for vote in existing}

    for vote in existing:
        if vote.option_id not in selected:
            db.delete(vote)

    db.add_all(
        [
            Vote(
                user_id=actor_id,
                option_id=option_id,
            )
            for option_id in selected - current
        ]
    )

    db.flush()
    audit(db, actor_id, "POLL_VOTE_UPDATE", poll)

    return [
        VoteRead.model_validate(vote)
        for vote in db.scalars(
            select(Vote)
            .where(
                Vote.user_id == actor_id,
                Vote.option_id.in_(valid_ids),
            )
            .order_by(Vote.option_id)
        )
    ]


def get_results(db, *, actor_id, trip_id, poll_id):
    trip_item(
        db,
        actor_id,
        trip_id,
        Poll,
        poll_id,
        lock=True,
    )

    counts = dict(
        db.execute(
            select(
                Vote.option_id,
                func.count(Vote.id),
            )
            .join(PollOption)
            .where(PollOption.poll_id == poll_id)
            .group_by(Vote.option_id)
        ).all()
    )

    mine = set(
        db.scalars(
            select(Vote.option_id)
            .join(PollOption)
            .where(
                PollOption.poll_id == poll_id,
                Vote.user_id == actor_id,
            )
        )
    )

    voters = db.scalar(
        select(func.count(func.distinct(Vote.user_id)))
        .join(
            PollOption,
            PollOption.id == Vote.option_id,
        )
        .where(PollOption.poll_id == poll_id)
    )

    return PollResults(
        poll_id=poll_id,
        total_voters=voters,
        total_votes=sum(counts.values()),
        options=[
            PollOptionResult(
                **PollOptionRead.model_validate(option).model_dump(),
                votes_count=counts.get(option.id, 0),
                selected_by_me=option.id in mine,
            )
            for option in _options(db, poll_id)
        ],
    )


@atomic
def delete_poll(db, *, actor_id, trip_id, poll_id):
    poll = _managed(db, actor_id, trip_id, poll_id)

    audit(db, actor_id, "POLL_DELETE", poll)
    db.delete(poll)