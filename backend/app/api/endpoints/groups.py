from fastapi import APIRouter, Response

from app.api.dependencies import (
    CurrentUser,
    DbSession,
    Pagination,
    PathId,
)
from app.schemas.common import OwnershipTransfer, Page
from app.schemas.group import (
    GroupCreate,
    GroupMemberAdd,
    GroupMemberRead,
    GroupRead,
    GroupUpdate,
)
from app.services import group_service

router = APIRouter(prefix="/groups", tags=["Grupos"])


@router.get("", response_model=Page[GroupRead])
def list_groups(
    db: DbSession,
    user: CurrentUser,
    pagination: Pagination,
):
    return group_service.list_groups(
        db,
        actor_id=user.id,
        pagination=pagination,
    )


@router.post("", response_model=GroupRead, status_code=201)
def create_group(
    data: GroupCreate,
    db: DbSession,
    user: CurrentUser,
):
    return group_service.create_group(
        db,
        actor_id=user.id,
        data=data,
    )


@router.get("/{group_id}", response_model=GroupRead)
def get_group(
    group_id: PathId,
    db: DbSession,
    user: CurrentUser,
):
    return group_service.get_group(
        db,
        actor_id=user.id,
        group_id=group_id,
    )


@router.patch("/{group_id}", response_model=GroupRead)
def update_group(
    group_id: PathId,
    data: GroupUpdate,
    db: DbSession,
    user: CurrentUser,
):
    return group_service.update_group(
        db,
        actor_id=user.id,
        group_id=group_id,
        data=data,
    )


@router.delete("/{group_id}", status_code=204)
def delete_group(
    group_id: PathId,
    db: DbSession,
    user: CurrentUser,
):
    group_service.delete_group(
        db,
        actor_id=user.id,
        group_id=group_id,
    )

    return Response(status_code=204)


@router.get(
    "/{group_id}/members",
    response_model=Page[GroupMemberRead],
)
def list_members(
    group_id: PathId,
    db: DbSession,
    user: CurrentUser,
    pagination: Pagination,
):
    return group_service.list_members(
        db,
        actor_id=user.id,
        group_id=group_id,
        pagination=pagination,
    )


@router.post(
    "/{group_id}/members",
    response_model=GroupMemberRead,
    status_code=201,
)
def add_member(
    group_id: PathId,
    data: GroupMemberAdd,
    db: DbSession,
    user: CurrentUser,
):
    return group_service.add_member(
        db,
        actor_id=user.id,
        group_id=group_id,
        data=data,
    )


@router.delete(
    "/{group_id}/members/{user_id}",
    status_code=204,
)
def remove_member(
    group_id: PathId,
    user_id: PathId,
    db: DbSession,
    user: CurrentUser,
):
    group_service.remove_member(
        db,
        actor_id=user.id,
        group_id=group_id,
        user_id=user_id,
    )

    return Response(status_code=204)


@router.post(
    "/{group_id}/ownership",
    response_model=GroupMemberRead,
)
def transfer_ownership(
    group_id: PathId,
    data: OwnershipTransfer,
    db: DbSession,
    user: CurrentUser,
):
    return group_service.transfer_ownership(
        db,
        actor_id=user.id,
        group_id=group_id,
        data=data,
    )