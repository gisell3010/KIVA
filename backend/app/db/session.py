from collections.abc import Generator
from sqlalchemy import URL, create_engine, text
from sqlalchemy.orm import Session, sessionmaker
from app.core.config import get_settings

settings = get_settings()

database_url = URL.create(
    drivername="postgresql+psycopg",
    username=settings.DB_USER,
    password=settings.DB_PASSWORD.get_secret_value(),
    host=settings.DB_HOST,
    port=settings.DB_PORT,
    database=settings.DB_NAME,
)

engine = create_engine(
    database_url,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=5,
    pool_timeout=30,
    pool_recycle=1800,
    echo=False,
    hide_parameters=True,
    connect_args={
        "connect_timeout": 10,
        "options": "-c timezone=UTC",
    },
)

SessionLocal = sessionmaker(
    bind=engine,
    class_=Session,
    autoflush=False,
    expire_on_commit=False,
)

def get_db() -> Generator[Session, None, None]:
    """Entrega una sesión por petición y la cierra al terminar."""
    db = SessionLocal()

    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

def check_db_connection() -> None:
    """Comprueba la conexión sin crear tablas ni modificar datos."""
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))
        connection.execute(text("SELECT tracking_token_hash FROM app.support_reports LIMIT 0"))
        connection.execute(text("SELECT id FROM app.support_messages LIMIT 0"))
        connection.execute(text("SELECT action_path FROM app.notifications LIMIT 0"))

def dispose_engine() -> None:
    """Libera las conexiones del pool durante el cierre de la aplicación."""
    engine.dispose()