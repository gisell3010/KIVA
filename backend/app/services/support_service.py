from typing import Literal
from sqlalchemy import func, select
from app.models.user import User
from app.models.group import GroupMember, TravelGroup
from app.models.trip import Trip, TripMember
from app.models.destination import Destination
from app.models.activity import Activity
from app.models.expense import Expense, ExpenseSplit
from app.models.poll import Poll, PollOption, Vote
from app.models.reservation import Reservation
from app.schemas.common import Schema, Page
from app.schemas.group import GroupRead
from app.schemas.trip import TripRead
from app.services._shared import active_user, allow, required, atomic, audit, mapped_page
from app.services.auth_service import invalidate_user_sessions
from app.services import group_service, trip_service

Section = Literal['participants', 'destinations', 'activities', 'expenses', 'splits', 'polls', 'options', 'reservations']

class DiagnosticRow(Schema):
    id: int
    title: str
    detail: str


def authorize(db, actor_id):
    allow(active_user(db, actor_id).role, {'SUPPORT', 'ADMIN', 'SUPER_ADMIN'})


def user_groups(db, *, actor_id, user_id, pagination):
    authorize(db, actor_id)
    required(db, select(User).where(User.id == user_id))
    ids = select(GroupMember.group_id).where(GroupMember.user_id == user_id)
    return mapped_page(db, group_service.group_query(user_id, all_trips=True)
                      .where(TravelGroup.id.in_(ids)).order_by(TravelGroup.id), pagination, GroupRead)


def user_trips(db, *, actor_id, user_id, pagination):
    authorize(db, actor_id)
    required(db, select(User).where(User.id == user_id))
    ids = select(TripMember.trip_id).where(TripMember.user_id == user_id)
    return mapped_page(db, trip_service.trip_query(user_id).where(Trip.id.in_(ids))
                      .order_by(Trip.id), pagination, TripRead)


@atomic
def revoke_sessions(db, *, actor_id, user_id):
    authorize(db, actor_id)
    user = required(db, select(User).where(User.id == user_id).with_for_update())
    allow(user.role, {'USER'})
    invalidate_user_sessions(db, user_id=user.id)
    audit(db, actor_id, 'SUPPORT_SESSIONS_REVOKE', user)


def trip_info(db, *, actor_id, trip_id):
    authorize(db, actor_id)
    return trip_service._read_trip(db, actor_id, trip_id)


def diagnostic(db, *, actor_id, trip_id, section, pagination):
    authorize(db, actor_id)
    required(db, select(Trip).where(Trip.id == trip_id))
    models = {'participants': TripMember, 'destinations': Destination, 'activities': Activity,
              'expenses': Expense, 'splits': ExpenseSplit, 'polls': Poll,
              'options': PollOption, 'reservations': Reservation}
    model = models[section]
    statement = select(model)
    if section == 'splits':
        statement = statement.join(Expense).where(Expense.trip_id == trip_id)
    elif section == 'options':
        statement = statement.join(Poll).where(Poll.trip_id == trip_id)
    else:
        statement = statement.where(model.trip_id == trip_id)
    total = db.scalar(select(func.count()).select_from(statement.subquery())) or 0
    rows = db.scalars(statement.order_by(model.id).offset((pagination.page-1)*pagination.page_size)
                      .limit(pagination.page_size)).all()
    user_ids = set()
    for row in rows:
        for key in ('user_id', 'paid_by_user_id', 'proposed_by_user_id'):
            value = getattr(row, key, None)
            if value: user_ids.add(value)
    names = dict(db.execute(select(User.id, User.full_name).where(User.id.in_(user_ids))).all()) if user_ids else {}
    votes = dict(db.execute(select(Vote.option_id, func.count(Vote.id)).where(Vote.option_id.in_([r.id for r in rows]))
                           .group_by(Vote.option_id)).all()) if section == 'options' else {}
    expenses = dict(db.execute(select(Expense.id, Expense.title).where(Expense.id.in_([r.expense_id for r in rows]))).all()) if section == 'splits' else {}
    polls = dict(db.execute(select(Poll.id, Poll.question).where(Poll.id.in_([r.poll_id for r in rows]))).all()) if section == 'options' else {}
    items = []
    for row in rows:
        if section == 'participants':
            title, detail = names.get(row.user_id, 'Usuario'), {'OWNER':'Responsable', 'ORGANIZER':'Organizador', 'MEMBER':'Participante'}[row.role]
        elif section == 'destinations':
            title = f'{row.place_name}, {row.country}'
            detail = f"Propuesto por {names.get(row.proposed_by_user_id, 'Usuario')} · {'Seleccionado' if row.is_selected else 'Propuesta'} · {row.description or ''}"
        elif section == 'activities':
            title, detail = row.title, f'{row.activity_date} · {row.start_time or ""} · {row.status} · {row.location or ""} · Costo: {row.estimated_cost}'
        elif section == 'expenses':
            title, detail = row.title, f'Pagador: {names.get(row.paid_by_user_id, "Usuario")} · Total: {row.amount} COP · {row.expense_date}'
        elif section == 'splits':
            title, detail = expenses.get(row.expense_id, 'Gasto'), f'{names.get(row.user_id, "Usuario")} · Parte: {row.amount} COP'
        elif section == 'polls':
            title, detail = row.question, f'{row.status} · Cierre: {row.closes_at or "Sin fecha"}'
        elif section == 'options':
            title, detail = row.option_text, f'{polls.get(row.poll_id, "Votación")} · {votes.get(row.id, 0)} votos'
        else:
            title, detail = row.title, f'{row.provider or ""} · {row.status} · {row.reservation_date} · {row.amount} COP'
        items.append(DiagnosticRow(id=row.id, title=title, detail=detail))
    return Page[DiagnosticRow](items=items, total=total, page=pagination.page, page_size=pagination.page_size)
