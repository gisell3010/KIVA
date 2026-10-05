from sqlalchemy import func, or_, select

from app.core.security import hash_password, verify_password
from app.models.user import User
from app.schemas.user import UserPublic, UserRead
from app.services.auth_service import invalidate_user_sessions
from app.services._shared import (
    active_user,
    after_transaction,
    allow,
    apply_patch,
    atomic,
    audit,
    fail,
    page,
    required,
    saved,
)
from app.storage.profile_images import (
    existing_image,
    remove_image,
    store_image,
)


def get_me(db, *, actor_id):
    return UserRead.model_validate(active_user(db, actor_id))


def search_users(db, *, actor_id, username, pagination):
    active_user(db, actor_id)
    query = username.strip().lower()

    if len(query) < 3:
        fail(
            "Escribe al menos tres caracteres.",
            "INVALID_SEARCH",
            422,
        )

    statement = (
        select(User)
        .where(
            User.status == "ACTIVE",
            func.lower(User.username).contains(query, autoescape=True),
        )
        .order_by(User.username, User.id)
    )

    return page(
        db,
        statement,
        pagination,
        UserPublic,
    )


@atomic
def update_me(db, *, actor_id, data):
    user = active_user(db, actor_id, lock=True)
    apply_patch(user, data)
    audit(db, actor_id, "USER_UPDATE", user)

    return saved(db, user, UserRead)


def _check_password(user, password):
    if not verify_password(
        password.get_secret_value(),
        user.password_hash,
    ):
        fail(
            "La contraseña actual es incorrecta.",
            "INVALID_PASSWORD",
            403,
        )


@atomic
def change_password(db, *, actor_id, data):
    user = active_user(db, actor_id, lock=True)
    _check_password(user, data.current_password)

    user.password_hash = hash_password(
        data.new_password.get_secret_value()
    )

    invalidate_user_sessions(db, user_id=user.id)
    audit(db, actor_id, "USER_PASSWORD_CHANGE", user)


@atomic
def change_email(db, *, actor_id, data):
    user = active_user(db, actor_id, lock=True)
    _check_password(user, data.current_password)

    user.email = str(data.email)

    invalidate_user_sessions(db, user_id=user.id)
    audit(db, actor_id, "USER_EMAIL_CHANGE", user)

    return saved(db, user, UserRead)


def list_users(
    db,
    *,
    actor_id,
    pagination,
    q=None,
    role=None,
    status=None,
):
    actor = active_user(db, actor_id)
    allow(actor.role, {"SUPER_ADMIN", "ADMIN", "SUPPORT"})

    statement = select(User)

    if q and q.strip():
        text = q.strip().lower()

        statement = statement.where(
            or_(
                func.lower(User.full_name).contains(
                    text,
                    autoescape=True,
                ),
                User.username.contains(
                    text,
                    autoescape=True,
                ),
                User.email.contains(
                    text,
                    autoescape=True,
                ),
            )
        )

    if role is not None:
        statement = statement.where(User.role == role)

    if status is not None:
        statement = statement.where(User.status == status)

    return page(
        db,
        statement.order_by(
            User.created_at.desc(),
            User.id.desc(),
        ),
        pagination,
        UserRead,
    )


def get_user(db, *, actor_id, user_id):
    actor = active_user(db, actor_id)
    allow(actor.role, {"SUPER_ADMIN", "ADMIN", "SUPPORT"})

    user = required(
        db,
        select(User).where(User.id == user_id),
    )

    return UserRead.model_validate(user)


@atomic
def admin_update_user(db, *, actor_id, user_id, data):
    actor = active_user(db, actor_id)
    allow(actor.role, {"SUPER_ADMIN", "ADMIN"})

    users = db.scalars(
        select(User)
        .order_by(User.id)
        .with_for_update()
        .execution_options(populate_existing=True)
    ).all()

    by_id = {user.id: user for user in users}
    actor = by_id[actor_id]

    if actor.status != "ACTIVE":
        fail(
            "La cuenta no está activa.",
            "ACCOUNT_INACTIVE",
            403,
        )

    allow(actor.role, {"SUPER_ADMIN", "ADMIN"})

    user = by_id.get(user_id)

    if user is None:
        fail(
            "Usuario no disponible.",
            "NOT_FOUND",
            404,
        )

    changes = data.model_dump(exclude_unset=True)

    if actor.role != "SUPER_ADMIN":
        if user.role != "USER" or "role" in changes:
            fail(
                "Esta operación requiere SUPER_ADMIN.",
                "FORBIDDEN",
                403,
            )

    apply_patch(user, data)

    if not any(
        item.role == "SUPER_ADMIN" and item.status == "ACTIVE"
        for item in users
    ):
        fail(
            "Debe conservarse un SUPER_ADMIN activo.",
            "LAST_SUPER_ADMIN",
        )

    invalidate_user_sessions(db, user_id=user.id)
    audit(db, actor_id, "USER_ADMIN_UPDATE", user)

    return saved(db, user, UserRead)


@atomic
def upload_profile_image(db, *, actor_id, stream):
    user = active_user(db, actor_id, lock=True)
    old = user.profile_image

    key = store_image(stream)

    after_transaction(
        db,
        lambda: remove_image(key),
        rollback=True,
    )

    user.profile_image = key

    if old:
        after_transaction(
            db,
            lambda: remove_image(old),
        )

    audit(db, actor_id, "USER_IMAGE_UPDATE", user)

    return saved(db, user, UserRead)


@atomic
def delete_profile_image(db, *, actor_id):
    user = active_user(db, actor_id, lock=True)

    if user.profile_image:
        key = user.profile_image
        user.profile_image = None

        after_transaction(
            db,
            lambda: remove_image(key),
        )

        audit(db, actor_id, "USER_IMAGE_DELETE", user)


def get_profile_image(db, *, actor_id, user_id):
    active_user(db, actor_id)

    user = required(
        db,
        select(User).where(
            User.id == user_id,
            User.status == "ACTIVE",
        ),
    )

    if not user.profile_image:
        fail(
            "El usuario no tiene imagen.",
            "IMAGE_NOT_FOUND",
            404,
        )

    return existing_image(user.profile_image)