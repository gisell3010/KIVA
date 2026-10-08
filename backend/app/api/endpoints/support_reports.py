from fastapi import APIRouter, Depends

from app.api.dependencies import (
    CurrentUser,
    DbSession,
    Pagination,
    PathId,
    require_browser_request,
)
from app.schemas.common import Page
from app.schemas.support import (
    PublicSupportReportCreate, PublicSupportReceipt, PublicSupportAccess, PublicSupportReply,
    SupportMessageCreate, SupportMessageRead,
    SupportReportCreate,
    SupportReportRead,
)
from app.services import support_service

router = APIRouter(
    prefix="/support-reports",
    tags=["Reportes de soporte"],
)


@router.post(
    "",
    response_model=SupportReportRead,
    status_code=201,
)
def create_report(
    data: SupportReportCreate,
    db: DbSession,
    user: CurrentUser,
):
    return support_service.create_report(
        db,
        actor_id=user.id,
        data=data,
    )


@router.post(
    "/public",
    response_model=PublicSupportReceipt,
    status_code=201,
    dependencies=[Depends(require_browser_request)],
)
def create_public_report(
    data: PublicSupportReportCreate,
    db: DbSession,
):
    return support_service.create_public_report(
        db,
        data=data,
    )


@router.get("", response_model=Page[SupportReportRead])
def list_my_reports(
    db: DbSession,
    user: CurrentUser,
    pagination: Pagination,
):
    return support_service.list_my_reports(
        db,
        actor_id=user.id,
        pagination=pagination,
    )


@router.post("/public/lookup", response_model=SupportReportRead, dependencies=[Depends(require_browser_request)])
def public_lookup(data: PublicSupportAccess, db: DbSession):
    return support_service.public_report(db, data=data)


@router.post("/public/messages", response_model=Page[SupportMessageRead], dependencies=[Depends(require_browser_request)])
def public_messages(data: PublicSupportAccess, db: DbSession, pagination: Pagination):
    return support_service.public_messages(db, data=data, pagination=pagination)


@router.post("/public/reply", response_model=SupportMessageRead, status_code=201, dependencies=[Depends(require_browser_request)])
def public_reply(data: PublicSupportReply, db: DbSession):
    return support_service.public_reply(db, data=data)


@router.get(
    "/{report_id}",
    response_model=SupportReportRead,
)
def get_my_report(
    report_id: PathId,
    db: DbSession,
    user: CurrentUser,
):
    return support_service.get_my_report(
        db,
        actor_id=user.id,
        report_id=report_id,
    )


@router.get("/{report_id}/messages", response_model=Page[SupportMessageRead])
def messages(report_id: PathId, db: DbSession, user: CurrentUser, pagination: Pagination):
    return support_service.list_messages(db, actor_id=user.id, report_id=report_id, pagination=pagination)


@router.post("/{report_id}/messages", response_model=SupportMessageRead, status_code=201)
def reply(report_id: PathId, data: SupportMessageCreate, db: DbSession, user: CurrentUser):
    return support_service.add_message(db, actor_id=user.id, report_id=report_id, data=data)


