import pytest
from httpx import AsyncClient
from fastapi import status

from app.models import User, TravelGroup, GroupMember, Trip, TripMember


class TestPermissionsAPI:
    @pytest.mark.asyncio
    async def test_user_cannot_access_admin_endpoints(
        self, async_client: AsyncClient, db, make_user
    ):
        user = make_user()
        login = await async_client.post(
            "/api/auth/login",
            json={"email": user.email, "password": "securepassword123"},
        )
        token = login.json()["access_token"]

        response = await async_client.get(
            "/api/admin/users",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.asyncio
    async def test_admin_can_access_admin_endpoints(
        self, async_client: AsyncClient, db, make_user
    ):
        admin = make_user(role="ADMIN")
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

    @pytest.mark.asyncio
    async def test_support_can_access_support_endpoints(
        self, async_client: AsyncClient, make_user
    ):
        support = make_user(role="SUPPORT")
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
    async def test_user_cannot_access_other_user_group(
        self, async_client: AsyncClient, scenario
    ):
        outsider = scenario.outsider
        login = await async_client.post(
            "/api/auth/login",
            json={"email": outsider.email, "password": "securepassword123"},
        )
        token = login.json()["access_token"]

        response = await async_client.get(
            f"/api/groups/{scenario.group.id}",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.asyncio
    async def test_group_member_can_access_group(
        self, async_client: AsyncClient, scenario
    ):
        member = scenario.member
        login = await async_client.post(
            "/api/auth/login",
            json={"email": member.email, "password": "securepassword123"},
        )
        token = login.json()["access_token"]

        response = await async_client.get(
            f"/api/groups/{scenario.group.id}",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.asyncio
    async def test_non_trip_member_cannot_access_trip(
        self, async_client: AsyncClient, scenario
    ):
        outsider = scenario.outsider
        login = await async_client.post(
            "/api/auth/login",
            json={"email": outsider.email, "password": "securepassword123"},
        )
        token = login.json()["access_token"]

        response = await async_client.get(
            f"/api/trips/{scenario.trip.id}",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.asyncio
    async def test_trip_member_can_access_trip(
        self, async_client: AsyncClient, scenario
    ):
        member = scenario.member
        login = await async_client.post(
            "/api/auth/login",
            json={"email": member.email, "password": "securepassword123"},
        )
        token = login.json()["access_token"]

        response = await async_client.get(
            f"/api/trips/{scenario.trip.id}",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.asyncio
    async def test_only_owner_can_delete_group(
        self, async_client: AsyncClient, scenario
    ):
        manager = scenario.manager
        login = await async_client.post(
            "/api/auth/login",
            json={"email": manager.email, "password": "securepassword123"},
        )
        token = login.json()["access_token"]

        response = await async_client.delete(
            f"/api/groups/{scenario.group.id}",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.asyncio
    async def test_owner_can_delete_group(
        self, async_client: AsyncClient, scenario
    ):
        owner = scenario.owner
        login = await async_client.post(
            "/api/auth/login",
            json={"email": owner.email, "password": "securepassword123"},
        )
        token = login.json()["access_token"]

        response = await async_client.delete(
            f"/api/groups/{scenario.group.id}",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == status.HTTP_204_NO_CONTENT

    @pytest.mark.asyncio
    async def test_only_owner_can_transfer_group_ownership(
        self, async_client: AsyncClient, scenario
    ):
        manager = scenario.manager
        login = await async_client.post(
            "/api/auth/login",
            json={"email": manager.email, "password": "securepassword123"},
        )
        token = login.json()["access_token"]

        response = await async_client.post(
            f"/api/groups/{scenario.group.id}/ownership",
            headers={"Authorization": f"Bearer {token}"},
            json={"new_owner_user_id": scenario.member.id},
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.asyncio
    async def test_only_organizer_or_owner_can_add_trip_member(
        self, async_client: AsyncClient, scenario
    ):
        member = scenario.member
        login = await async_client.post(
            "/api/auth/login",
            json={"email": member.email, "password": "securepassword123"},
        )
        token = login.json()["access_token"]

        outsider = scenario.outsider
        response = await async_client.post(
            f"/api/trips/{scenario.trip.id}/members",
            headers={"Authorization": f"Bearer {token}"},
            json={"user_id": outsider.id},
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.asyncio
    async def test_organizer_can_add_trip_member(
        self, async_client: AsyncClient, scenario
    ):
        manager = scenario.manager
        login = await async_client.post(
            "/api/auth/login",
            json={"email": manager.email, "password": "securepassword123"},
        )
        token = login.json()["access_token"]

        outsider = scenario.outsider
        response = await async_client.post(
            f"/api/trips/{scenario.trip.id}/members",
            headers={"Authorization": f"Bearer {token}"},
            json={"user_id": outsider.id},
        )

        assert response.status_code == status.HTTP_201_CREATED