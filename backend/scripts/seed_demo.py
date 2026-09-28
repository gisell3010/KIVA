import sys
from datetime import datetime, time, timedelta, timezone
from decimal import Decimal
from getpass import getpass

from pydantic import SecretStr, TypeAdapter, ValidationError
from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import hash_password
from app.models import (
    Activity,
    Destination,
    Expense,
    ExpenseCategory,
    ExpenseSplit,
    GroupMember,
    Poll,
    PollOption,
    Reservation,
    ReservationType,
    TravelGroup,
    Trip,
    TripMember,
    User,
    Vote,
)
from app.schemas.common import NewPassword
from app.services.audit_service import record_action
from app.services.notification_service import create_notification

DEMO_USERS = (
    ("demo_owner", "Ana Demo", "USER"),
    ("demo_organizer", "Luis Demo", "USER"),
    ("demo_member", "Sara Demo", "USER"),
    ("demo_admin", "Administrador Demo", "ADMIN"),
    ("demo_support", "Soporte Demo", "SUPPORT"),
)


def seed_demo(
    db: Session,
    password: SecretStr,
) -> None:
    if get_settings().APP_ENV not in {"development", "test"}:
        raise ValueError(
            "Los datos de demostración solo se permiten "
            "en development o test."
        )

    password = TypeAdapter(NewPassword).validate_python(password)

    usernames = [
        username
        for username, _, _ in DEMO_USERS
    ]

    emails = [
        f"{username}@example.com"
        for username in usernames
    ]

    existing = db.scalar(
        select(User.id)
        .where(
            or_(
                User.username.in_(usernames),
                User.email.in_(emails),
            )
        )
        .limit(1)
    )

    if existing is not None:
        raise ValueError(
            "Ya existe una cuenta demo. "
            "No se modificó ningún registro."
        )

    category = db.scalar(
        select(ExpenseCategory).where(
            ExpenseCategory.name == "Alojamiento"
        )
    )

    reservation_type = db.scalar(
        select(ReservationType).where(
            ReservationType.name == "Alojamiento"
        )
    )

    if category is None or reservation_type is None:
        raise ValueError(
            "Primero instala los catálogos de gastos y reservas."
        )

    users = []

    for username, name, role in DEMO_USERS:
        user = User(
            full_name=name,
            username=username,
            email=f"{username}@example.com",
            password_hash=hash_password(
                password.get_secret_value()
            ),
            role=role,
            status="ACTIVE",
        )

        db.add(user)
        users.append(user)

    db.flush()

    participants = users[:3]

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    start = now.date() + timedelta(days=30)

    group = TravelGroup(
        name="KIVA Demo",
        description=(
            "Grupo ficticio para probar la organización de viajes."
        ),
    )

    db.add(group)
    db.flush()

    for index, user in enumerate(participants):
        db.add(
            GroupMember(
                group_id=group.id,
                user_id=user.id,
                role="OWNER" if index == 0 else "MEMBER",
            )
        )

    trip = Trip(
        group_id=group.id,
        name="Europa Demo",
        description=(
            "Viaje ficticio; todos los importes "
            "están expresados en COP."
        ),
        start_date=start,
        end_date=start + timedelta(days=9),
        status="CONFIRMED",
    )

    db.add(trip)
    db.flush()

    for user, role in zip(
        participants,
        ("OWNER", "ORGANIZER", "MEMBER"),
    ):
        db.add(
            TripMember(
                trip_id=trip.id,
                user_id=user.id,
                role=role,
            )
        )

    destinations = (
        ("España", "Madrid"),
        ("Francia", "París"),
        ("Italia", "Roma"),
    )

    for index, (country, place) in enumerate(destinations):
        db.add(
            Destination(
                trip_id=trip.id,
                proposed_by_user_id=participants[index].id,
                country=country,
                place_name=place,
                description="Destino de demostración.",
                is_selected=index < 2,
            )
        )

    db.add_all(
        [
            Activity(
                trip_id=trip.id,
                title="Recorrido por Madrid",
                location="Madrid",
                activity_date=start + timedelta(days=1),
                start_time=time(9, 0),
                estimated_cost=Decimal("50000.00"),
                status="APPROVED",
            ),
            Activity(
                trip_id=trip.id,
                title="Visita a un museo",
                location="París",
                activity_date=start + timedelta(days=5),
                start_time=time(10, 30),
                estimated_cost=Decimal("80000.00"),
                status="PROPOSED",
            ),
        ]
    )

    expense = Expense(
        trip_id=trip.id,
        paid_by_user_id=participants[0].id,
        category_id=category.id,
        title="Anticipo de alojamiento demo",
        amount=Decimal("300000.00"),
        expense_date=now.date(),
    )

    db.add(expense)
    db.flush()

    for user in participants:
        db.add(
            ExpenseSplit(
                expense_id=expense.id,
                user_id=user.id,
                amount=Decimal("100000.00"),
            )
        )

    poll = Poll(
        trip_id=trip.id,
        question="¿Qué destinos te gustaría visitar?",
        status="OPEN",
        closes_at=now + timedelta(days=7),
    )

    db.add(poll)
    db.flush()

    options = [
        PollOption(
            poll_id=poll.id,
            option_number=index,
            option_text=place,
        )
        for index, place in enumerate(
            ("Madrid", "París", "Roma"),
            1,
        )
    ]

    db.add_all(options)
    db.flush()

    for user, selected in (
        (participants[0], (0, 1)),
        (participants[1], (1, 2)),
    ):
        for index in selected:
            db.add(
                Vote(
                    user_id=user.id,
                    option_id=options[index].id,
                )
            )

    db.add(
        Reservation(
            trip_id=trip.id,
            type_id=reservation_type.id,
            title="Alojamiento de demostración",
            provider="Proveedor ficticio",
            reservation_date=start,
            amount=Decimal("300000.00"),
            status="CONFIRMED",
        )
    )

    for user in participants:
        create_notification(
            db,
            user_id=user.id,
            title="Viaje de demostración",
            message=(
                "Ya puedes probar destinos, actividades, "
                "gastos y votaciones múltiples."
            ),
        )

    record_action(
        db,
        user_id=None,
        action="DEMO_SEED",
        entity="app.travel_groups",
        entity_id=group.id,
    )

    db.flush()


def main() -> int:
    try:
        settings = get_settings()

        if settings.APP_ENV not in {"development", "test"}:
            raise ValueError(
                "Este script está bloqueado en producción."
            )

        if not sys.stdin.isatty():
            raise ValueError(
                "Ejecuta este comando en una terminal interactiva."
            )

        from app.db.session import SessionLocal

        print(
            f"Base: {settings.DB_NAME} | "
            f"Entorno: {settings.APP_ENV}"
        )

        password = getpass(
            "Contraseña para las cinco cuentas demo "
            "(10 a 128 caracteres): "
        )

        if password != getpass("Repite la contraseña: "):
            raise ValueError(
                "Las contraseñas no coinciden."
            )

        secret = TypeAdapter(NewPassword).validate_python(password)

        with SessionLocal.begin() as db:
            seed_demo(db, secret)

        print("Datos de demostración cargados.")
        print(
            "Accede usando el correo y la contraseña "
            "que acabas de introducir:"
        )

        for username, _, role in DEMO_USERS:
            print(f"{username}@example.com — {role}")

        return 0

    except ValidationError:
        print(
            "Revisa la configuración y utiliza una contraseña "
            "de 10 a 128 caracteres.",
            file=sys.stderr,
        )

    except IntegrityError:
        print(
            "Existe un conflicto de datos. La carga se revirtió.",
            file=sys.stderr,
        )

    except SQLAlchemyError as exc:
        original = getattr(exc, "orig", None)
        sqlstate = getattr(original, "sqlstate", None)

        print(
            f"Tipo de error: {type(exc).__name__}",
            file=sys.stderr,
        )
        print(
            f"Código PostgreSQL: {sqlstate or 'No disponible'}",
            file=sys.stderr,
        )

    except ValueError as exc:
        print(str(exc), file=sys.stderr)

    except (KeyboardInterrupt, EOFError):
        print(
            "\nOperación cancelada.",
            file=sys.stderr,
        )

    return 1


if __name__ == "__main__":
    raise SystemExit(main())