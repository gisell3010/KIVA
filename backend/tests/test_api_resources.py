import pytest
from httpx import AsyncClient
from fastapi import status

from app.models import User, TravelGroup, Trip, TripMember, ExpenseCategory, ReservationType


class TestResourcesAPI:
    @pytest.mark.asyncio
    async def test_create_destination(self, async_client: AsyncClient, scenario):
        owner = scenario.owner
        login = await async_client.post(
            "/api/auth/login",
            json={"email": owner.email, "password": "securepassword123"},
        )
        token = login.json()["access_token"]

        data = {
            "country": "España",
            "place_name": "Madrid",
            "description": "Capital de España",
        }

        response = await async_client.post(
            f"/api/trips/{scenario.trip.id}/destinations",
            headers={"Authorization": f"Bearer {token}"},
            json=data,
        )

        assert response.status_code == status.HTTP_201_CREATED
        json_data = response.json()
        assert json_data["country"] == "España"
        assert json_data["place_name"] == "Madrid"

    @pytest.mark.asyncio
    async def test_list_destinations(self, async_client: AsyncClient, scenario):
        owner = scenario.owner
        login = await async_client.post(
            "/api/auth/login",
            json={"email": owner.email, "password": "securepassword123"},
        )
        token = login.json()["access_token"]

        response = await async_client.get(
            f"/api/trips/{scenario.trip.id}/destinations",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.asyncio
    async def test_select_destination(self, async_client: AsyncClient, scenario):
        owner = scenario.owner
        login = await async_client.post(
            "/api/auth/login",
            json={"email": owner.email, "password": "securepassword123"},
        )
        token = login.json()["access_token"]

        dest_response = await async_client.post(
            f"/api/trips/{scenario.trip.id}/destinations",
            headers={"Authorization": f"Bearer {token}"},
            json={"country": "Francia", "place_name": "París"},
        )
        dest_id = dest_response.json()["id"]

        response = await async_client.put(
            f"/api/trips/{scenario.trip.id}/destinations/{dest_id}/selection",
            headers={"Authorization": f"Bearer {token}"},
            json={"is_selected": True},
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.json()["is_selected"] is True

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
            json={"country": "Italia", "place_name": "Roma"},
        )
        dest_id = dest_response.json()["id"]

        files = {"file": ("test.png", image_stream(), "image/png")}
        response = await async_client.post(
            f"/api/trips/{scenario.trip.id}/destinations/{dest_id}/photos",
            headers={"Authorization": f"Bearer {token}"},
            files=files,
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert "image_url" in response.json()

    @pytest.mark.asyncio
    async def test_create_activity(self, async_client: AsyncClient, scenario):
        owner = scenario.owner
        login = await async_client.post(
            "/api/auth/login",
            json={"email": owner.email, "password": "securepassword123"},
        )
        token = login.json()["access_token"]

        data = {
            "title": "Visita museo",
            "description": "Museo del Prado",
            "activity_date": "2026-12-02",
            "start_time": "10:00",
            "estimated_cost": "20000",
        }

        response = await async_client.post(
            f"/api/trips/{scenario.trip.id}/activities",
            headers={"Authorization": f"Bearer {token}"},
            json=data,
        )

        assert response.status_code == status.HTTP_201_CREATED
        json_data = response.json()
        assert json_data["title"] == "Visita museo"
        assert json_data["status"] == "PROPOSED"

    @pytest.mark.asyncio
    async def test_create_expense(self, async_client: AsyncClient, scenario):
        owner = scenario.owner
        login = await async_client.post(
            "/api/auth/login",
            json={"email": owner.email, "password": "securepassword123"},
        )
        token = login.json()["access_token"]

        data = {
            "paid_by_user_id": owner.id,
            "category_id": scenario.category.id,
            "title": "Cena grupal",
            "amount": "150000",
            "expense_date": "2026-12-02",
            "splits": [
                {"user_id": owner.id, "amount": "50000"},
                {"user_id": scenario.manager.id, "amount": "50000"},
                {"user_id": scenario.member.id, "amount": "50000"},
            ],
        }

        response = await async_client.post(
            f"/api/trips/{scenario.trip.id}/expenses",
            headers={"Authorization": f"Bearer {token}"},
            json=data,
        )

        assert response.status_code == status.HTTP_201_CREATED
        json_data = response.json()
        assert json_data["title"] == "Cena grupal"
        assert len(json_data["splits"]) == 3

    @pytest.mark.asyncio
    async def test_get_expense_balances(self, async_client: AsyncClient, scenario):
        owner = scenario.owner
        login = await async_client.post(
            "/api/auth/login",
            json={"email": owner.email, "password": "securepassword123"},
        )
        token = login.json()["access_token"]

        response = await async_client.get(
            f"/api/trips/{scenario.trip.id}/expenses/balances",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == status.HTTP_200_OK
        json_data = response.json()
        assert isinstance(json_data, list)

    @pytest.mark.asyncio
    async def test_create_poll(self, async_client: AsyncClient, scenario):
        owner = scenario.owner
        login = await async_client.post(
            "/api/auth/login",
            json={"email": owner.email, "password": "securepassword123"},
        )
        token = login.json()["access_token"]

        data = {
            "question": "¿Dónde cenar?",
            "options": [
                {"option_text": "Restaurante A"},
                {"option_text": "Restaurante B"},
            ],
        }

        response = await async_client.post(
            f"/api/trips/{scenario.trip.id}/polls",
            headers={"Authorization": f"Bearer {token}"},
            json=data,
        )

        assert response.status_code == status.HTTP_201_CREATED
        json_data = response.json()
        assert json_data["question"] == "¿Dónde cenar?"
        assert len(json_data["options"]) == 2

    @pytest.mark.asyncio
    async def test_vote_poll(self, async_client: AsyncClient, scenario):
        member = scenario.member
        login = await async_client.post(
            "/api/auth/login",
            json={"email": member.email, "password": "securepassword123"},
        )
        token = login.json()["access_token"]

        poll_response = await async_client.post(
            f"/api/trips/{scenario.trip.id}/polls",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "question": "¿Dónde cenar?",
                "options": [{"option_text": "A"}, {"option_text": "B"}],
            },
        )
        poll_id = poll_response.json()["id"]
        option_id = poll_response.json()["options"][0]["id"]

        response = await async_client.put(
            f"/api/trips/{scenario.trip.id}/polls/{poll_id}/votes",
            headers={"Authorization": f"Bearer {token}"},
            json={"option_ids": [option_id]},
        )

        assert response.status_code == status.HTTP_200_OK

        results = await async_client.get(
            f"/api/trips/{scenario.trip.id}/polls/{poll_id}/results",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert results.json()["options"][0]["selected_by_me"] is True

    @pytest.mark.asyncio
    async def test_create_reservation(self, async_client: AsyncClient, scenario):
        owner = scenario.owner
        login = await async_client.post(
            "/api/auth/login",
            json={"email": owner.email, "password": "securepassword123"},
        )
        token = login.json()["access_token"]

        data = {
            "type_id": scenario.reservation_type.id,
            "title": "Hotel central",
            "provider": "Booking.com",
            "reservation_date": "2026-12-01",
            "amount": "200000",
        }

        response = await async_client.post(
            f"/api/trips/{scenario.trip.id}/reservations",
            headers={"Authorization": f"Bearer {token}"},
            json=data,
        )

        assert response.status_code == status.HTTP_201_CREATED
        json_data = response.json()
        assert json_data["title"] == "Hotel central"
        assert json_data["status"] == "PENDING"

    @pytest.mark.asyncio
    async def test_list_notifications(self, async_client: AsyncClient, scenario):
        owner = scenario.owner
        login = await async_client.post(
            "/api/auth/login",
            json={"email": owner.email, "password": "securepassword123"},
        )
        token = login.json()["access_token"]

        response = await async_client.get(
            "/api/notifications",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.asyncio
    async def test_mark_notification_read(self, async_client: AsyncClient, scenario):
        owner = scenario.owner
        login = await async_client.post(
            "/api/auth/login",
            json={"email": owner.email, "password": "securepassword123"},
        )
        token = login.json()["access_token"]

        notif_response = await async_client.get(
            "/api/notifications",
            headers={"Authorization": f"Bearer {token}"},
        )
        if notif_response.json()["total"] > 0:
            notif_id = notif_response.json()["items"][0]["id"]
            response = await async_client.patch(
                f"/api/notifications/{notif_id}",
                headers={"Authorization": f"Bearer {token}"},
                json={"is_read": True},
            )
            assert response.status_code == status.HTTP_200_OK

    @pytest.mark.asyncio
    async def test_calendar_events(self, async_client: AsyncClient, scenario):
        owner = scenario.owner
        login = await async_client.post(
            "/api/auth/login",
            json={"email": owner.email, "password": "securepassword123"},
        )
        token = login.json()["access_token"]

        response = await async_client.get(
            "/api/calendar?start_date=2026-12-01&end_date=2026-12-31",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == status.HTTP_200_OK
        json_data = response.json()
        assert isinstance(json_data, list)