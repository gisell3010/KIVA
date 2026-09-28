import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.exc import SQLAlchemyError

from app.api.endpoints import health


@pytest.fixture
def client():
    app = FastAPI()
    app.include_router(health.router, prefix="/api")

    with TestClient(app) as test_client:
        yield test_client


def test_liveness_does_not_query_database(
    client,
    monkeypatch,
):
    def unexpected_query():
        raise AssertionError(
            "Liveness no debe consultar PostgreSQL"
        )

    monkeypatch.setattr(
        health,
        "check_db_connection",
        unexpected_query,
    )

    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
    assert response.headers["cache-control"] == "no-store"


def test_readiness_with_database(client, test_engine):
    response = client.get("/api/health/ready")

    assert response.status_code == 200

    assert response.json() == {
        "status": "ok",
        "database": "ok",
    }


def test_readiness_hides_database_errors(
    client,
    monkeypatch,
):
    def unavailable():
        raise SQLAlchemyError(
            "Detalle interno que no debe exponerse"
        )

    monkeypatch.setattr(
        health,
        "check_db_connection",
        unavailable,
    )

    response = client.get("/api/health/ready")

    assert response.status_code == 503

    assert response.json() == {
        "status": "error",
        "database": "unavailable",
    }

    assert "Detalle interno" not in response.text