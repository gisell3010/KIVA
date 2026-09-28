from datetime import datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app.core.security import (
    decode_access_token,
    decode_refresh_token,
    hash_refresh_token,
    verify_password,
)
from app.models import AuthSession, User
from app.schemas.auth import LoginRequest, RegisterRequest
from app.services import auth_service as service


def test_register_creates_user_and_session(db, register_data):
    result = service.register(db, register_data)
    user = db.get(User, result.response.user.id)

    access = decode_access_token(result.response.access_token)
    refresh = decode_refresh_token(result.refresh_token)
    session = db.get(AuthSession, int(refresh["sid"]))

    assert user.role == "USER"
    assert user.status == "ACTIVE"
    assert user.full_name == register_data.full_name
    assert user.password_hash != register_data.password.get_secret_value()

    assert verify_password(
        register_data.password.get_secret_value(),
        user.password_hash,
    )

    assert access["sub"] == refresh["sub"] == str(user.id)
    assert access["sid"] == refresh["sid"] == str(session.id)
    assert session.user_id == user.id
    assert session.refresh_token_hash == hash_refresh_token(
        result.refresh_token
    )
    assert session.revoked_at is None

    assert "password_hash" not in result.response.user.model_dump()
    assert "refresh_token" not in result.response.model_dump()


def test_registration_rejects_client_role(register_data):
    payload = register_data.model_dump()
    payload["role"] = "SUPER_ADMIN"

    with pytest.raises(ValidationError):
        RegisterRequest.model_validate(payload)


@pytest.mark.parametrize("field", ["username", "email"])
def test_register_rejects_duplicate_account(
    db,
    registered,
    register_data,
    expect_error,
    field,
):
    payload = register_data.model_dump()

    if field == "username":
        payload["email"] = "another_account@example.com"
    else:
        payload["username"] = "another_account"

    with expect_error(409, "USER_ALREADY_EXISTS"):
        service.register(
            db,
            RegisterRequest.model_validate(payload),
        )

    assert db.get(User, registered.response.user.id) is not None


def test_login_creates_an_independent_session(
    db,
    registered,
    register_data,
    password,
):
    result = service.login(
        db,
        LoginRequest(
            email=register_data.email,
            password=password,
        ),
    )

    previous = decode_refresh_token(registered.refresh_token)
    current = decode_refresh_token(result.refresh_token)

    assert result.response.user.id == registered.response.user.id
    assert current["sid"] != previous["sid"]

    sessions = service.list_sessions(
        db,
        user_id=result.response.user.id,
    )

    assert {session.id for session in sessions} == {
        int(previous["sid"]),
        int(current["sid"]),
    }


@pytest.mark.parametrize("unknown_user", [False, True])
def test_login_rejects_invalid_credentials(
    db,
    registered,
    register_data,
    password,
    expect_error,
    unknown_user,
):
    data = LoginRequest(
        email=(
            "unknown_account@example.com"
            if unknown_user
            else register_data.email
        ),
        password=(
            password
            if unknown_user
            else password + "_wrong"
        ),
    )

    with expect_error(401, "INVALID_CREDENTIALS"):
        service.login(db, data)


def test_suspended_user_cannot_login_or_refresh(
    db,
    registered,
    register_data,
    password,
    expect_error,
):
    user = db.get(User, registered.response.user.id)
    user.status = "SUSPENDED"
    db.commit()

    with expect_error(403, "ACCOUNT_INACTIVE"):
        service.login(
            db,
            LoginRequest(
                email=register_data.email,
                password=password,
            ),
        )

    with expect_error(403, "ACCOUNT_INACTIVE"):
        service.refresh(db, registered.refresh_token)


def test_refresh_rotates_token_and_reuse_revokes_session(
    db,
    registered,
    expect_error,
):
    result = service.refresh(db, registered.refresh_token)

    previous = decode_refresh_token(registered.refresh_token)
    current = decode_refresh_token(result.refresh_token)

    assert result.refresh_token != registered.refresh_token
    assert current["sid"] == previous["sid"]
    assert current["exp"] == previous["exp"]

    with expect_error(401, "INVALID_SESSION"):
        service.refresh(db, registered.refresh_token)

    with expect_error(401, "INVALID_SESSION"):
        service.refresh(db, result.refresh_token)

    session = db.get(AuthSession, int(current["sid"]))
    assert session.revoked_at is not None


def test_expired_session_cannot_refresh(
    db,
    registered,
    expect_error,
):
    claims = decode_refresh_token(registered.refresh_token)
    session = db.get(AuthSession, int(claims["sid"]))

    session.expires_at = (
        datetime.now(timezone.utc) - timedelta(seconds=1)
    )
    db.commit()

    with expect_error(401, "INVALID_SESSION"):
        service.refresh(db, registered.refresh_token)


def test_access_token_cannot_refresh(
    db,
    registered,
    expect_error,
):
    with expect_error(401, "INVALID_TOKEN"):
        service.refresh(db, registered.response.access_token)


def test_revoking_session_prevents_refresh(
    db,
    registered,
    expect_error,
):
    claims = decode_refresh_token(registered.refresh_token)
    user_id = registered.response.user.id

    service.revoke_session(
        db,
        user_id=user_id,
        session_id=int(claims["sid"]),
    )

    assert service.list_sessions(db, user_id=user_id) == []

    with expect_error(401, "INVALID_SESSION"):
        service.refresh(db, registered.refresh_token)


def test_user_cannot_revoke_another_users_session(
    db,
    registered,
    make_user,
    expect_error,
):
    other = make_user()
    claims = decode_refresh_token(registered.refresh_token)

    with expect_error(404, "SESSION_NOT_FOUND"):
        service.revoke_session(
            db,
            user_id=other.id,
            session_id=int(claims["sid"]),
        )

    assert service.refresh(db, registered.refresh_token)


def test_logout_all_revokes_every_session(
    db,
    registered,
    register_data,
    password,
    expect_error,
):
    second = service.login(
        db,
        LoginRequest(
            email=register_data.email,
            password=password,
        ),
    )
    user_id = registered.response.user.id

    service.logout_all(db, user_id=user_id)

    assert service.list_sessions(db, user_id=user_id) == []

    for token in (
        registered.refresh_token,
        second.refresh_token,
    ):
        with expect_error(401, "INVALID_SESSION"):
            service.refresh(db, token)