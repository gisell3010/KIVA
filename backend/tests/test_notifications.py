from sqlalchemy import func, select

from app.models import Notification
from app.schemas.notification import NotificationUpdate
from app.services import notification_service as service


def test_notification_is_private(
    db,
    scenario,
    pagination,
    expect_error,
):
    note = service.create_notification(
        db,
        user_id=scenario.member.id,
        title="Aviso",
        message="Prueba",
    )

    db.commit()

    own = service.list_notifications(
        db,
        user_id=scenario.member.id,
        pagination=pagination,
    )

    other = service.list_notifications(
        db,
        user_id=scenario.outsider.id,
        pagination=pagination,
    )

    assert own.total == 1
    assert other.total == 0

    with expect_error(404):
        service.update_notification(
            db,
            user_id=scenario.outsider.id,
            notification_id=note.id,
            data=NotificationUpdate(is_read=True),
        )


def test_mark_read_and_delete(db, scenario):
    note = service.create_notification(
        db,
        user_id=scenario.member.id,
        title="Aviso",
        message="Prueba",
    )

    db.commit()

    assert service.unread_count(
        db,
        user_id=scenario.member.id,
    ).total == 1

    service.mark_all_read(
        db,
        user_id=scenario.member.id,
    )

    assert service.unread_count(
        db,
        user_id=scenario.member.id,
    ).total == 0

    service.delete_notification(
        db,
        user_id=scenario.member.id,
        notification_id=note.id,
    )

    assert db.scalar(
        select(func.count()).select_from(Notification)
    ) == 0

def test_notify_trip_members_excludes_actor(db, scenario, pagination):
    service.notify_trip_members(
        db,
        trip_id=scenario.trip.id,
        title="Nueva votación",
        message="Hay una nueva votación.",
        exclude_user_id=scenario.owner.id,
    )
    db.commit()

    owner = service.list_notifications(
        db,
        user_id=scenario.owner.id,
        pagination=pagination,
    )
    manager = service.list_notifications(
        db,
        user_id=scenario.manager.id,
        pagination=pagination,
    )
    member = service.list_notifications(
        db,
        user_id=scenario.member.id,
        pagination=pagination,
    )
    outsider = service.list_notifications(
        db,
        user_id=scenario.outsider.id,
        pagination=pagination,
    )

    assert owner.total == 0
    assert manager.total == 1
    assert member.total == 1
    assert outsider.total == 0


def test_long_event_text_does_not_abort_business_transaction(db, scenario):
    from app.services.notification_service import create_notification
    item = create_notification(db, user_id=scenario.member.id, title="Nueva votación", message="A" * 400, action_path="/votaciones")
    db.flush()
    assert len(item.message) == 300 and item.message.endswith("...")
