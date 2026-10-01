from fastapi import APIRouter

from app.api.dependencies import CurrentUser, DbSession
from app.schemas.dashboard import DashboardRead
from app.services import dashboard_service

router = APIRouter(prefix="/dashboard", tags=["Panel"])


@router.get("", response_model=DashboardRead)
def get_dashboard(db: DbSession, user: CurrentUser):
    return dashboard_service.get_dashboard(
        db,
        actor_id=user.id,
    )