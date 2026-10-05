import os
import secrets
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from io import BytesIO
from pathlib import Path
from types import SimpleNamespace

import pytest
from dotenv import dotenv_values
from PIL import Image
from sqlalchemy import select, text
from sqlalchemy.orm import Session

ENV_FILE = Path(__file__).resolve().parents[1] / ".env.test"

if not ENV_FILE.is_file():
    raise pytest.UsageError(
        "Crea backend/.env.test antes de ejecutar las pruebas."
    )

values = dotenv_values(ENV_FILE, interpolate=False)

for name in (
    "DB_HOST",
    "DB_PORT",
    "DB_NAME",
    "DB_USER",
    "DB_PASSWORD",
):
    if not values.get(name):
        raise pytest.UsageError(
            f"Falta {name} en .env.test."
        )

    os.environ[name] = values[name]

if not os.environ["DB_NAME"].endswith("_test"):
    raise pytest.UsageError(
        "La base de pruebas debe terminar en _test."
    )

os.environ["KIVA_ENV_FILE"] = str(ENV_FILE)
os.environ["APP_ENV"] = "test"
os.environ["JWT_SECRET"] = secrets.token_urlsafe(48)

from app.core.config import get_settings
from app.core.exceptions import AppError
from app.core.security import hash_password
from app.db.base import Base
from app.models import (
    ExpenseCategory,
    GroupMember,
    ReservationType,
    TravelGroup,
    Trip,
    TripMember,
    User,
)
from app.schemas.auth import RegisterRequest
from app.schemas.common import PaginationParams
from app.schemas.destination import DestinationCreate
from app.schemas.poll import PollCreate
from app.services import (
    auth_service,
    destination_service,
    poll_service,
)


@pytest.fixture(scope="session")
def test_engine():
    from app.db.session import engine

    try:
        with engine.connect() as connection:
            database = connection.scalar(
                text("SELECT current_database()")
            )

            if (
                database != get_settings().DB_NAME
                or not database.endswith("_test")
            ):
                raise pytest.UsageError(
                    "Conexión de pruebas no permitida."
                )

            catalogs = {
                "expense_categories",
                "reservation_types",
            }

            for table in Base.metadata.sorted_tables:
                if table.name not in catalogs:
                    existing = connection.execute(
                        select(table).limit(1)
                    ).first()

                    if existing is not None:
                        raise pytest.UsageError(
                            "Usa una base de pruebas sin datos, "
                            "salvo los catálogos."
                        )

        yield engine
    finally:
        engine.dispose()


@pytest.fixture
def db(test_engine):
    with test_engine.connect() as connection:
        transaction = connection.begin()

        session = Session(
            bind=connection,
            autoflush=False,
            expire_on_commit=False,
            join_transaction_mode="create_savepoint",
        )

        try:
            yield session
        finally:
            session.close()
            transaction.rollback()


@pytest.fixture(autouse=True)
def isolated_uploads(tmp_path, monkeypatch):
    directory = tmp_path / "uploads"

    monkeypatch.setattr(
        get_settings(),
        "UPLOADS_DIR",
        directory,
    )

    return directory


@pytest.fixture(scope="session")
def password():
    return secrets.token_urlsafe(24)


@pytest.fixture(scope="session")
def password_hash(password):
    return hash_password(password)


@pytest.fixture
def make_user(db, password_hash):
    def create(*, role="USER", status="ACTIVE"):
        suffix = secrets.token_hex(6)

        user = User(
            full_name="Usuario de prueba",
            username=f"test_{suffix}",
            email=f"test_{suffix}@example.com",
            password_hash=password_hash,
            role=role,
            status=status,
        )

        db.add(user)
        db.commit()

        return user

    return create


@pytest.fixture
def scenario(db, make_user):
    owner = make_user()
    manager = make_user()
    member = make_user()
    outsider = make_user()
    admin = make_user(role="ADMIN")
    support = make_user(role="SUPPORT")
    superadmin = make_user(role="SUPER_ADMIN")

    group = TravelGroup(name="Grupo de prueba")

    db.add(group)
    db.flush()

    for user in (owner, manager, member):
        db.add(
            GroupMember(
                group_id=group.id,
                user_id=user.id,
                role=(
                    "OWNER"
                    if user.id == owner.id
                    else "MEMBER"
                ),
            )
        )

    start = (
        datetime.now(timezone.utc).date()
        + timedelta(days=30)
    )

    trip = Trip(
        group_id=group.id,
        name="Viaje de prueba",
        start_date=start,
        end_date=start + timedelta(days=9),
        status="PLANNING",
    )

    db.add(trip)
    db.flush()

    for user, role in (
        (owner, "OWNER"),
        (manager, "ORGANIZER"),
        (member, "MEMBER"),
    ):
        db.add(
            TripMember(
                trip_id=trip.id,
                user_id=user.id,
                role=role,
            )
        )

    db.commit()

    category = db.scalar(
        select(ExpenseCategory).where(
            ExpenseCategory.name == "Transporte"
        )
    )

    reservation_type = db.scalar(
        select(ReservationType).where(
            ReservationType.name == "Alojamiento"
        )
    )

    if category is None or reservation_type is None:
        pytest.fail(
            "Instala los catálogos SQL en la base de pruebas."
        )

    return SimpleNamespace(
        owner=owner,
        manager=manager,
        member=member,
        outsider=outsider,
        admin=admin,
        support=support,
        superadmin=superadmin,
        group=group,
        trip=trip,
        category=category,
        reservation_type=reservation_type,
    )


@pytest.fixture
def register_data(password):
    suffix = secrets.token_hex(6)

    return RegisterRequest(
        first_name="Ana",
        first_last_name="Prueba",
        username=f"register_{suffix}",
        email=f"register_{suffix}@example.com",
        password=password,
    )


@pytest.fixture
def registered(db, register_data):
    return auth_service.register(db, register_data)


@pytest.fixture
def pagination():
    return PaginationParams()


@pytest.fixture
def expect_error():
    @contextmanager
    def expect(status, code=None):
        with pytest.raises(AppError) as captured:
            yield

        assert captured.value.status_code == status

        if code is not None:
            assert captured.value.code == code

    return expect


@pytest.fixture
def destination(db, scenario):
    return destination_service.create_destination(
        db,
        actor_id=scenario.member.id,
        trip_id=scenario.trip.id,
        data=DestinationCreate(
            country="España",
            place_name="Madrid",
        ),
    )


@pytest.fixture
def poll(db, scenario):
    return poll_service.create_poll(
        db,
        actor_id=scenario.owner.id,
        trip_id=scenario.trip.id,
        data=PollCreate(
            question="¿Qué lugares visitar?",
            options=[
                {"option_text": "Madrid"},
                {"option_text": "París"},
                {"option_text": "Roma"},
            ],
        ),
    )


@pytest.fixture
def image_stream():
    def create():
        stream = BytesIO()

        Image.new(
            "RGB",
            (32, 32),
            "blue",
        ).save(stream, format="PNG")

        stream.seek(0)
        return stream

    return create

@pytest.fixture
def client(db):
    from fastapi.testclient import TestClient
    from app.main import app
    from app.db.session import get_db
    app.dependency_overrides[get_db] = lambda: db
    try:
        with TestClient(app, headers={'X-KIVA-CSRF': '1'}) as test_client:
            yield test_client
    finally:
        app.dependency_overrides.clear()


@pytest.fixture
def login_headers(client, password):
    def login(user):
        response = client.post('/api/auth/login', json={'email': user.email, 'password': password})
        assert response.status_code == 200, response.text
        return {'Authorization': f'Bearer {response.json()["access_token"]}'}
    return login
