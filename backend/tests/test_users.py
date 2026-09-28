from app.models import User
from app.schemas.auth import (
    EmailChangeRequest,
    LoginRequest,
    PasswordChangeRequest,
)
from app.schemas.user import UserAdminUpdate, UserUpdate
from app.services import auth_service
from app.services import user_service as service


def test_update_profile_and_public_search(
    db,
    scenario,
    pagination,
):
    result = service.update_me(
        db,
        actor_id=scenario.member.id,
        data=UserUpdate(full_name="Nombre actualizado"),
    )

    assert result.full_name == "Nombre actualizado"

    public = service.search_users(
        db,
        actor_id=scenario.owner.id,
        username=scenario.member.username,
        pagination=pagination,
    )

    assert public.total == 1
    assert "email" not in public.items[0].model_dump()


def test_password_change_revokes_sessions(
    db,
    registered,
    register_data,
    password,
    expect_error,
):
    service.change_password(
        db,
        actor_id=registered.response.user.id,
        data=PasswordChangeRequest(
            current_password=password,
            new_password=password + "X",
        ),
    )

    with expect_error(401):
        auth_service.refresh(db, registered.refresh_token)

    with expect_error(401):
        auth_service.login(
            db,
            LoginRequest(
                email=register_data.email,
                password=password,
            ),
        )

    assert auth_service.login(
        db,
        LoginRequest(
            email=register_data.email,
            password=password + "X",
        ),
    )


def test_email_change_requires_password(
    db,
    registered,
    password,
    expect_error,
):
    with expect_error(403):
        service.change_email(
            db,
            actor_id=registered.response.user.id,
            data=EmailChangeRequest(
                email="nuevo@example.com",
                current_password="incorrecta",
            ),
        )

    result = service.change_email(
        db,
        actor_id=registered.response.user.id,
        data=EmailChangeRequest(
            email="nuevo@example.com",
            current_password=password,
        ),
    )

    assert result.email == "nuevo@example.com"

    with expect_error(401):
        auth_service.refresh(db, registered.refresh_token)


def test_admin_cannot_assign_roles_or_suspend_superadmin(
    db,
    scenario,
    expect_error,
):
    with expect_error(403):
        service.admin_update_user(
            db,
            actor_id=scenario.admin.id,
            user_id=scenario.member.id,
            data=UserAdminUpdate(role="ADMIN"),
        )

    with expect_error(403):
        service.admin_update_user(
            db,
            actor_id=scenario.admin.id,
            user_id=scenario.superadmin.id,
            data=UserAdminUpdate(status="SUSPENDED"),
        )


def test_last_active_superadmin_is_preserved(
    db,
    scenario,
    expect_error,
):
    with expect_error(409, "LAST_SUPER_ADMIN"):
        service.admin_update_user(
            db,
            actor_id=scenario.superadmin.id,
            user_id=scenario.superadmin.id,
            data=UserAdminUpdate(status="SUSPENDED"),
        )

    assert db.get(
        User,
        scenario.superadmin.id,
    ).status == "ACTIVE"