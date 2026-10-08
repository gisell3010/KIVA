from logging.config import fileConfig
from alembic import context
from app.db.base import Base
from app.db.session import engine, database_url
import app.models  # Registra todas las tablas.

config = context.config
if config.config_file_name:
    fileConfig(config.config_file_name)


def include_object(obj, name, type_, reflected, compare_to):
    return not (type_ == "table" and name == "alembic_version")


def configure(**kwargs):
    context.configure(target_metadata=Base.metadata, include_schemas=True,
        compare_type=True, version_table_schema="auth", include_object=include_object, **kwargs)


if context.is_offline_mode():
    configure(url=database_url.render_as_string(hide_password=False), literal_binds=True,
        dialect_opts={"paramstyle": "named"})
    with context.begin_transaction():
        context.run_migrations()
else:
    with engine.connect() as connection:
        configure(connection=connection)
        with context.begin_transaction():
            context.run_migrations()
