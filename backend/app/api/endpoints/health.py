from fastapi import APIRouter, Response, status
from sqlalchemy.exc import SQLAlchemyError

from app.db.session import check_db_connection
from app.schemas.health import HealthRead, ReadinessRead


router = APIRouter(prefix="/health", tags=["Salud"])


@router.get("", response_model=HealthRead)
def health(response: Response) -> HealthRead:
    response.headers["Cache-Control"] = "no-store"
    return HealthRead(status="ok")


@router.get(
    "/ready",
    response_model=ReadinessRead,
    responses={503: {"model": ReadinessRead}},
)
def readiness(response: Response) -> ReadinessRead:
    response.headers["Cache-Control"] = "no-store"

    try:
        check_db_connection()
    except SQLAlchemyError:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return ReadinessRead(
            status="error",
            database="unavailable",
        )

    return ReadinessRead(
        status="ok",
        database="ok",
    )