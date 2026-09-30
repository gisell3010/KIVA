import pytest
from httpx import AsyncClient
from fastapi import status

from app.models import User, TravelGroup, GroupMember, Trip, TripMember


class TestAdminAPI:
    @pytest.mark.asyncio
    async def test_admin_dashboard(self, async_client: AsyncClient, db, make_user):
        admin = make_user(role="ADMIN")
        login = await async_client.post(
            "/api/auth/login",
            json={"email": admin.email, "password": "securepassword123"},
        )
        token = login.json()["access_token"]

        response = await async_client.get(
            "/api/admin/dashboard",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == status.HTTP_200_OK
        json_data = response.json()
        assert "users_count" in json_data
        assert "groups_count" in json_data
        assert "trips_count" in json_data

    @pytest.mark.asyncio
    async def test_admin_list_users(self, async_client: AsyncClient, db, make_user):
        admin = make_user(role="ADMIN")
        make_user()  # regular user
        make_user()  # another regular user

        login = await async_client.post(
            "/api/auth/login",
            json={"email": admin.email, "password": "securepassword123"},
        )
        token = login.json()["access_token"]

        response = await async_client.get(
            "/api/admin/users",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == status.HTTP_200_OK
        json_data = response.json()
        assert json_data["total"] >= 3

    @pytest.mark.asyncio
    async def test_admin_filter_users_by_role(self, async_client: AsyncClient, db, make_user):
        admin = make_user(role="ADMIN")
        make_user(role="USER")

        login = await async_client.post(
            "/api/auth/login",
            json={"email": admin.email, "password": "securepassword123"},
        )
        token = login.json()["access_token"]

        response = await async_client.get(
            "/api/admin/users?role=USER",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == status.HTTP_200_OK
        json_data = response.json()
        assert all(u["role"] == "USER" for u in json_data["items"])

    @pytest.mark.asyncio
    async def test_admin_update_user(self, async_client: AsyncClient, db, make_user):
        admin = make_user(role="ADMIN")
        target = make_user(role="USER")

        login = await async_client.post(
            "/api/auth/login",
            json={"email": admin.email, "password": "securepassword123"},
        )
        token = login.json()["access_token"]

        response = await async_client.patch(
            f"/api/admin/users/{target.id}",
            headers={"Authorization": f"Bearer {token}"},
            json={"role": "ADMIN"},
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.json()["role"] == "ADMIN"

    @pytest.mark.asyncio
    async def test_admin_list_groups(self, async_client: AsyncClient, db, make_user):
        admin = make_user(role="ADMIN")
        make_user()  # another user for group owner

        login = await async_client.post(
            "/api/auth/login",
            json={"email": admin.email, "password": "securepassword123"},
        )
        token = login.json()["access_token"]

        response = await async_client.get(
            "/api/admin/groups",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.asyncio
    async def test_admin_list_trips(self, async_client: AsyncClient, db, make_user):
        admin = make_user(role="ADMIN")
        owner = make_user()
        group = TravelGroup(name="Test Group")
        db.add(group)
        db.flush()

        trip = Trip(
            group_id=group.id,
            name="Test Trip",
            start_date="2026-12-01",
            end_date="2026-12-10",
            status="PLANNING",
        )
        db.add(trip)
        db.commit()

        login = await async_client.post(
            "/api/auth/login",
            json={"email": admin.email, "password": "securepassword123"},
        )
        token = login.json()["access_token"]

        response = await async_client.get(
            "/api/admin/trips",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == status.HTTP_200_OK
        json_data = response.json()
        assert json_data["total"] >= 1

    @pytest.mark.asyncio
    async def test_support_dashboard(self, async_client: AsyncClient, make_user):
        support = make_user(role="SUPPORT")
        login = await async_client.post(
            "/api/auth/login",
            json={"email": support.email, "password": "securepassword123"},
        )
        token = login.json()["access_token"]

        response = await async_client.get(
            "/api/support/dashboard",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == status.HTTP_200_OK
        json_data = response.json()
        assert "users_count" in json_data

    @pytest.mark.asyncio
    async def test_support_list_users(self, async_client: AsyncClient, make_user):
        support = make_user(role="SUPPORT")
        make_user()

        login = await async_client.post(
            "/api/auth/login",
            json={"email": support.email, "password": "securepassword123"},
        )
        token = login.json()["access_token"]

        response = await async_client.get(
            "/api/support/users",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.asyncio
    async def test_superadmin_dashboard(self, async_client: AsyncClient, make_user):
        superadmin = make_user(role="SUPER_ADMIN")
        login = await async_client.post(
            "/api/auth/login",
            json={"email": superadmin.email, "password": "securepassword123"},
        )
        token = login.json()["access_token"]

        response = await async_client.get(
            "/api/super-admin/dashboard",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.asyncio
    async def test_superadmin_config(self, async_client: AsyncClient, make_user):
        superadmin = make_user(role="SUPER_ADMIN")
        login = await async_client.post(
            "/api/auth/login",
            json={"email": superadmin.email, "password": "securepassword123"},
        )
        token = login.json()["access_token"]

        response = await async_client.get(
            "/api/super-admin/config",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.asyncio
    async def test_superadmin_audit_logs(self, async_client: AsyncClient, make_user):
        superadmin = make_user(role="SUPER_ADMIN")
        login = await async_client.post(
            "/api/auth/login",
            json={"email": superadmin.email, "password": "securepassword123"},
        )
        token = login.json()["access_token"]

        response = await async_client.get(
            "/api/super-admin/audit-logs",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.asyncio
    async def test_superadmin_health(self, async_client: AsyncClient, make_user):
        superadmin = make_user(role="SUPER_ADMIN")
        login = await async_client.post(
            "/api/auth/login",
            json={"email": superadmin.email, "password": "securepassword123"},
        )
        token = login.json()["access_token"]

        response = await async_client.get(
            "/api/super-admin/health",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code in (status.HTTP_200_OK, status.HTTP_503_SERVICE_UNAVAILABLE)