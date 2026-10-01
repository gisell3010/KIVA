import pytest
from httpx import AsyncClient
from fastapi import status

from app.models import User, TravelGroup, Trip, TripMember


class TestTripsAPI:
    @pytest.mark.asyncio
    async def test_create_trip(self, async_client: AsyncClient, scenario):
        owner = scenario.owner
        login = await async_client.post(
            "/api/auth/login",
            json={"email": owner.email, "password": "securepassword123"},
        )
        token = login.json()["access_token"]

        data = {
            "group_id": scenario.group.id,
            "name": "Nuevo viaje",
            "description": "Descripción del viaje",
            "start_date": "2026-12-01",
            "end_date": "2026-12-10",
        }

        response = await async_client.post(
            "/api/trips",
            headers={"Authorization": f"Bearer {token}"},
            json=data,
        )

        assert response.status_code == status.HTTP_201_CREATED
        json_data = response.json()
        assert json_data["name"] == data["name"]
        assert json_data["group_id"] == data["group_id"]
        assert json_data["my_role"] == "OWNER"

    @pytest.mark.asyncio
    async def test_list_trips(self, async_client: AsyncClient, scenario):
        owner = scenario.owner
        login = await async_client.post(
            "/api/auth/login",
            json={"email": owner.email, "password": "securepassword123"},
        )
        token = login.json()["access_token"]

        response = await async_client.get(
            "/api/trips",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == status.HTTP_200_OK
        json_data = response.json()
        assert json_data["total"] >= 1

    @pytest.mark.asyncio
    async def test_get_trip(self, async_client: AsyncClient, scenario):
        owner = scenario.owner
        login = await async_client.post(
            "/api/auth/login",
            json={"email": owner.email, "password": "securepassword123"},
        )
        token = login.json()["access_token"]

        response = await async_client.get(
            f"/api/trips/{scenario.trip.id}",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == status.HTTP_200_OK
        json_data = response.json()
        assert json_data["id"] == scenario.trip.id
        assert json_data["name"] == scenario.trip.name

    @pytest.mark.asyncio
    async def test_update_trip(self, async_client: AsyncClient, scenario):
        owner = scenario.owner
        login = await async_client.post(
            "/api/auth/login",
            json={"email": owner.email, "password": "securepassword123"},
        )
        token = login.json()["access_token"]

        response = await async_client.patch(
            f"/api/trips/{scenario.trip.id}",
            headers={"Authorization": f"Bearer {token}"},
            json={"name": "Viaje actualizado"},
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.json()["name"] == "Viaje actualizado"

    @pytest.mark.asyncio
    async def test_delete_trip(self, async_client: AsyncClient, scenario):
        owner = scenario.owner
        login = await async_client.post(
            "/api/auth/login",
            json={"email": owner.email, "password": "securepassword123"},
        )
        token = login.json()["access_token"]

        response = await async_client.delete(
            f"/api/trips/{scenario.trip.id}",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == status.HTTP_204_NO_CONTENT

    @pytest.mark.asyncio
    async def test_list_trip_members(self, async_client: AsyncClient, scenario):
        owner = scenario.owner
        login = await async_client.post(
            "/api/auth/login",
            json={"email": owner.email, "password": "securepassword123"},
        )
        token = login.json()["access_token"]

        response = await async_client.get(
            f"/api/trips/{scenario.trip.id}/members",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == status.HTTP_200_OK
        json_data = response.json()
        assert json_data["total"] >= 3

    @pytest.mark.asyncio
    async def test_add_trip_member(self, async_client: AsyncClient, scenario):
        owner = scenario.owner
        login = await async_client.post(
            "/api/auth/login",
            json={"email": owner.email, "password": "securepassword123"},
        )
        token = login.json()["access_token"]

        outsider = scenario.outsider
        response = await async_client.post(
            f"/api/trips/{scenario.trip.id}/members",
            headers={"Authorization": f"Bearer {token}"},
            json={"user_id": outsider.id, "role": "MEMBER"},
        )

        assert response.status_code == status.HTTP_201_CREATED

    @pytest.mark.asyncio
    async def test_remove_trip_member(self, async_client: AsyncClient, scenario):
        owner = scenario.owner
        login = await async_client.post(
            "/api/auth/login",
            json={"email": owner.email, "password": "securepassword123"},
        )
        token = login.json()["access_token"]

        response = await async_client.delete(
            f"/api/trips/{scenario.trip.id}/members/{scenario.manager.id}",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == status.HTTP_204_NO_CONTENT

    @pytest.mark.asyncio
    async def test_transfer_trip_ownership(self, async_client: AsyncClient, scenario):
        owner = scenario.owner
        login = await async_client.post(
            "/api/auth/login",
            json={"email": owner.email, "password": "securepassword123"},
        )
        token = login.json()["access_token"]

        response = await async_client.post(
            f"/api/trips/{scenario.trip.id}/ownership",
            headers={"Authorization": f"Bearer {token}"},
            json={"new_owner_user_id": scenario.manager.id},
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.json()["role"] == "OWNER"