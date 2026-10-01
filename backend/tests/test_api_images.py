import pytest
from httpx import AsyncClient
from fastapi import status

from app.models import User, TravelGroup, Trip, TripMember


class TestImagesAPI:
    @pytest.mark.asyncio
    async def test_upload_profile_image(self, async_client: AsyncClient, scenario, image_stream):
        owner = scenario.owner
        login = await async_client.post(
            "/api/auth/login",
            json={"email": owner.email, "password": "securepassword123"},
        )
        token = login.json()["access_token"]

        files = {"file": ("profile.png", image_stream(), "image/png")}
        response = await async_client.put(
            "/api/users/me/profile-image",
            headers={"Authorization": f"Bearer {token}"},
            files=files,
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.json()["profile_image"] is not None

    @pytest.mark.asyncio
    async def test_delete_profile_image(self, async_client: AsyncClient, scenario, image_stream):
        owner = scenario.owner
        login = await async_client.post(
            "/api/auth/login",
            json={"email": owner.email, "password": "securepassword123"},
        )
        token = login.json()["access_token"]

        files = {"file": ("profile.png", image_stream(), "image/png")}
        await async_client.put(
            "/api/users/me/profile-image",
            headers={"Authorization": f"Bearer {token}"},
            files=files,
        )

        response = await async_client.delete(
            "/api/users/me/profile-image",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == status.HTTP_204_NO_CONTENT

    @pytest.mark.asyncio
    async def test_get_profile_image(self, async_client: AsyncClient, scenario, image_stream):
        owner = scenario.owner
        login = await async_client.post(
            "/api/auth/login",
            json={"email": owner.email, "password": "securepassword123"},
        )
        token = login.json()["access_token"]

        files = {"file": ("profile.png", image_stream(), "image/png")}
        await async_client.put(
            "/api/users/me/profile-image",
            headers={"Authorization": f"Bearer {token}"},
            files=files,
        )

        response = await async_client.get(
            f"/api/users/{owner.id}/profile-image",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.headers["content-type"] == "image/jpeg"

    @pytest.mark.asyncio
    async def test_upload_destination_photo(self, async_client: AsyncClient, scenario, image_stream):
        owner = scenario.owner
        login = await async_client.post(
            "/api/auth/login",
            json={"email": owner.email, "password": "securepassword123"},
        )
        token = login.json()["access_token"]

        dest_response = await async_client.post(
            f"/api/trips/{scenario.trip.id}/destinations",
            headers={"Authorization": f"Bearer {token}"},
            json={"country": "España", "place_name": "Madrid"},
        )
        dest_id = dest_response.json()["id"]

        files = {"file": ("dest.png", image_stream(), "image/png")}
        response = await async_client.post(
            f"/api/trips/{scenario.trip.id}/destinations/{dest_id}/photos",
            headers={"Authorization": f"Bearer {token}"},
            files=files,
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert "image_url" in response.json()

    @pytest.mark.asyncio
    async def test_reorder_destination_photos(self, async_client: AsyncClient, scenario, image_stream):
        owner = scenario.owner
        login = await async_client.post(
            "/api/auth/login",
            json={"email": owner.email, "password": "securepassword123"},
        )
        token = login.json()["access_token"]

        dest_response = await async_client.post(
            f"/api/trips/{scenario.trip.id}/destinations",
            headers={"Authorization": f"Bearer {token}"},
            json={"country": "España", "place_name": "Madrid"},
        )
        dest_id = dest_response.json()["id"]

        files = {"file": ("dest1.png", image_stream(), "image/png")}
        await async_client.post(
            f"/api/trips/{scenario.trip.id}/destinations/{dest_id}/photos",
            headers={"Authorization": f"Bearer {token}"},
            files=files,
        )

        photo_response = await async_client.post(
            f"/api/trips/{scenario.trip.id}/destinations/{dest_id}/photos",
            headers={"Authorization": f"Bearer {token}"},
            files={"file": ("dest2.png", image_stream(), "image/png")},
        )
        photo_ids = [p["id"] for p in [photo_response.json()]]

        response = await async_client.put(
            f"/api/trips/{scenario.trip.id}/destinations/{dest_id}/photos/order",
            headers={"Authorization": f"Bearer {token}"},
            json={"photo_ids": photo_ids},
        )

        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.asyncio
    async def test_get_destination_photo_file(self, async_client: AsyncClient, scenario, image_stream):
        owner = scenario.owner
        login = await async_client.post(
            "/api/auth/login",
            json={"email": owner.email, "password": "securepassword123"},
        )
        token = login.json()["access_token"]

        dest_response = await async_client.post(
            f"/api/trips/{scenario.trip.id}/destinations",
            headers={"Authorization": f"Bearer {token}"},
            json={"country": "España", "place_name": "Madrid"},
        )
        dest_id = dest_response.json()["id"]

        files = {"file": ("dest.png", image_stream(), "image/png")}
        photo_response = await async_client.post(
            f"/api/trips/{scenario.trip.id}/destinations/{dest_id}/photos",
            headers={"Authorization": f"Bearer {token}"},
            files=files,
        )
        photo_id = photo_response.json()["id"]

        response = await async_client.get(
            f"/api/trips/{scenario.trip.id}/destinations/{dest_id}/photos/{photo_id}/file",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.headers["content-type"] == "image/jpeg"

    @pytest.mark.asyncio
    async def test_delete_destination_photo(self, async_client: AsyncClient, scenario, image_stream):
        owner = scenario.owner
        login = await async_client.post(
            "/api/auth/login",
            json={"email": owner.email, "password": "securepassword123"},
        )
        token = login.json()["access_token"]

        dest_response = await async_client.post(
            f"/api/trips/{scenario.trip.id}/destinations",
            headers={"Authorization": f"Bearer {token}"},
            json={"country": "España", "place_name": "Madrid"},
        )
        dest_id = dest_response.json()["id"]

        files = {"file": ("dest.png", image_stream(), "image/png")}
        photo_response = await async_client.post(
            f"/api/trips/{scenario.trip.id}/destinations/{dest_id}/photos",
            headers={"Authorization": f"Bearer {token}"},
            files=files,
        )
        photo_id = photo_response.json()["id"]

        response = await async_client.delete(
            f"/api/trips/{scenario.trip.id}/destinations/{dest_id}/photos/{photo_id}",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == status.HTTP_204_NO_CONTENT