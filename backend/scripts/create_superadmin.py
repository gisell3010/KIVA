import sys
from getpass import getpass
from typing import Annotated

from pydantic import Field, ValidationError
from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.user import User
from app.schemas.common import (
    Email,
    NewPassword,
    NonEmptyText,
    Schema,
    Username,
)
from app.services.audit_service import record_action


class SuperadminInput(Schema):
    full_name: Annotated[NonEmptyText, Field(max_length=120)]
    username: Username
    email: Email
    password: NewPassword


def create_superadmin(
    db: Session,
    data: SuperadminInput,
) -> int:
    existing = db.scalar(
        select(User.id)
        .where(
            or_(
                User.username == data.username,
                User.email == str(data.email),
            )
        )
        .limit(1)
    )

    if existing is not None:
        raise ValueError(
            "El correo o nombre de usuario ya está registrado."
        )

    user = User(
        full_name=data.full_name,
        username=data.username,
        email=str(data.email),
        password_hash=hash_password(
            data.password.get_secret_value()
        ),
        role="SUPER_ADMIN",
        status="ACTIVE",
    )

    db.add(user)
    db.flush()

    record_action(
        db,
        user_id=None,
        action="SUPER_ADMIN_CREATE_SCRIPT",
        entity="auth.users",
        entity_id=user.id,
    )

    return user.id


def main() -> int:
    try:
        from app.core.config import get_settings
        from app.db.session import SessionLocal

        if not sys.stdin.isatty():
            raise ValueError(
                "Ejecuta este comando en una terminal interactiva."
            )

        settings = get_settings()

        print(
            f"Base: {settings.DB_NAME} | "
            f"Entorno: {settings.APP_ENV}"
        )

        full_name = input("Nombre completo: ").strip()
        username = input("Nombre de usuario: ").strip()
        email = input("Correo: ").strip()

        password = getpass(
            "Contraseña (10 a 128 caracteres): "
        )

        if password != getpass("Repite la contraseña: "):
            raise ValueError(
                "Las contraseñas no coinciden."
            )

        data = SuperadminInput(
            full_name=full_name,
            username=username,
            email=email,
            password=password,
        )

        with SessionLocal.begin() as db:
            user_id = create_superadmin(db, data)

        print(f"SUPER_ADMIN creado. ID: {user_id}.")
        return 0

    except ValidationError as exc:
        fields = sorted({
            ".".join(str(part) for part in error["loc"])
            for error in exc.errors(include_input=False)
        })

        print(
            f"Revisa estos campos: {', '.join(fields)}.",
            file=sys.stderr,
        )

    except IntegrityError:
        print(
            "No se creó la cuenta: existe un conflicto de datos.",
            file=sys.stderr,
        )

    except SQLAlchemyError:
        print(
            "No se creó la cuenta. Revisa la conexión "
            "y la instalación de la base.",
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