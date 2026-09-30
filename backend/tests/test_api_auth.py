import pytest
from httpx import AsyncClient
from fastapi import status

from app.models import User


class TestAuthAPI:
    @pytest.mark.asyncio
    async def test_register(self, async_client: AsyncClient):
        data = {
            "first_name": "Test",
            "first_last_name": "User",
            "username": "testuser",
            "email": "test@example.com",
            "password": "securepassword123",
        }

        response = await async_client.post("/api/auth/register", json=data)

        assert response.status_code == status.HTTP_201_CREATED
        json_data = response.json()
        assert "access_token" in json_data
        assert json_data["user"]["email"] == data["email"]
        assert json_data["user"]["username"] == data["username"]
        assert json_data["user"]["role"] == "USER"

    @pytest.mark.asyncio
    async def test_register_duplicate_email(self, async_client: AsyncClient, db):
        user = User(
            full_name="Existing User",
            username="existing",
            email="existing@example.com",
            password_hash="hashed",
        )
        db.add(user)
        db.commit()

        data = {
            "first_name": "Test",
            "first_last_name": "User",
            "username": "newuser",
            "email": "existing@example.com",
            "password": "securepassword123",
        }

        response = await async_client.post("/api/auth/register", json=data)

        assert response.status_code == status.HTTP_409_CONFLICT

    @pytest.mark.asyncio
    async def test_login(self, async_client: AsyncClient, registered):
        data = {
            "email": registered.response.user.email,
            "password": "securepassword123",
        }

        response = await async_client.post("/api/auth/login", json=data)

        assert response.status_code == status.HTTP_200_OK
        json_data = response.json()
        assert "access_token" in json_data
        assert "refresh_token" in response.cookies

    @pytest.mark.asyncio
    async def test_login_invalid_credentials(self, async_client: AsyncClient):
        data = {
            "email": "nonexistent@example.com",
            "password": "wrongpassword",
        }

        response = await async_client.post("/api/auth/login", json=data)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.asyncio
    async def test_refresh_token(self, async_client: AsyncClient, registered):
        login_response = await async_client.post(
            "/api/auth/login",
            json={
                "email": registered.response.user.email,
                "password": "securepassword123",
            },
        )
        refresh_token = login_response.cookies.get("kiva_refresh")

        assert refresh_token is not None

        response = await async_client.post(
            "/api/auth/refresh",
            cookies={"kiva_refresh": refresh_token},
        )

        assert response.status_code == status.HTTP_200_OK
        assert "access_token" in response.json()

    @pytest.mark.asyncio
    async def test_logout(self, async_client: AsyncClient, registered):
        await async_client.post(
            "/api/auth/login",
            json={
                "email": registered.response.user.email,
                "password": "securepassword123",
            },
        )

        response = await async_client.post("/api/auth/logout")

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert "kiva_refresh" not in response.cookies

    @pytest.mark.asyncio
    async def test_logout_all(self, async_client: AsyncClient, registered):
        await async_client.post(
            "/api/auth/login",
            json={
                "email": registered.response.user.email,
                "password": "securepassword123",
            },
        )

        response = await async_client.post("/api/auth/logout-all")

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert "kiva_refresh" not in response.cookies

    @pytest.mark.asyncio
    async def test_get_me(self, async_client: AsyncClient, registered):
        login_response = await async_client.post(
            "/api/auth/login",
            json={
                "email": registered.response.user.email,
                "password": "securepassword123",
            },
        )
        access_token = login_response.json()["access_token"]

        response = await async_client.get(
            "/api/users/me",
            headers={"Authorization": f"Bearer {access_token}"},
        )

        assert response.status_code == status.HTTP_200_OK
        json_data = response.json()
        assert json_data["email"] == registered.response.user.email

    @pytest.mark.asyncio
    async def test_update_me(self, async_client: AsyncClient, registered):
        login_response = await async_client.post(
            "/api/auth/login",
            json={
                "email": registered.response.user.email,
                "password": "securepassword123",
            },
        )
        access_token = login_response.json()["access_token"]

        response = await async_client.patch(
            "/api/users/me",
            headers={"Authorization": f"Bearer {access_token}"},
            json={"full_name": "Updated Name"},
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.json()["full_name"] == "Updated Name"

    @pytest.mark.asyncio
    async def test_change_password(self, async_client: AsyncClient, registered):
        login_response = await async_client.post(
            "/api/auth/login",
            json={
                "email": registered.response.user.email,
                "password": "securepassword123",
            },
        )
        access_token = login_response.json()["access_token"]

        response = await async_client.put(
            "/api/users/me/password",
            headers={"Authorization": f"Bearer {access_token}"},
            json={
                "current_password": "securepassword123",
                "new_password": "newsecurepassword456",
            },
        )

        assert response.status_code == status.HTTP_204_NO_CONTENT

    @pytest.mark.asyncio
    async def test_change_email(self, async_client: AsyncClient, registered):
        login_response = await async_client.post(
            "/api/auth/login",
            json={
                "email": registered.response.user.email,
                "password": "securepassword123",
            },
        )
        access_token = login_response.json()["access_token"]

        response = await async_client.put(
            "/api/users/me/email",
            headers={"Authorization": f"Bearer {access_token}"},
            json={
                "email": "newemail@example.com",
                "current_password": "securepassword123",
            },
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.json()["email"] == "newemail@example.com"