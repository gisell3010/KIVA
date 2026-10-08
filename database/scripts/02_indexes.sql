-- ##################################################
-- #                 KIVA - ÍNDICES                 #
-- ##################################################

BEGIN;

CREATE INDEX IF NOT EXISTS idx_auth_sessions_user
    ON auth.auth_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires
    ON auth.auth_sessions (expires_at);
CREATE INDEX IF NOT EXISTS idx_group_members_user
    ON app.group_members (user_id);
CREATE INDEX IF NOT EXISTS idx_trips_group
    ON app.trips (group_id);
CREATE INDEX IF NOT EXISTS idx_trip_members_user
    ON app.trip_members (user_id);
CREATE INDEX IF NOT EXISTS idx_destinations_trip
    ON app.destinations (trip_id);
CREATE INDEX IF NOT EXISTS idx_destinations_proposer
    ON app.destinations (proposed_by_user_id);
CREATE INDEX IF NOT EXISTS idx_destination_photos_user
    ON app.destination_photos (uploaded_by_user_id);
CREATE INDEX IF NOT EXISTS idx_activities_trip_date
    ON app.activities (trip_id, activity_date, start_time);
CREATE INDEX IF NOT EXISTS idx_expenses_trip_date
    ON app.expenses (trip_id, expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_payer
    ON app.expenses (paid_by_user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category
    ON app.expenses (category_id);
CREATE INDEX IF NOT EXISTS idx_expense_splits_user
    ON app.expense_splits (user_id);
CREATE INDEX IF NOT EXISTS idx_polls_trip
    ON app.polls (trip_id);
CREATE INDEX IF NOT EXISTS idx_votes_user
    ON app.votes (user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_trip_date
    ON app.reservations (trip_id, reservation_date);
CREATE INDEX IF NOT EXISTS idx_reservations_type
    ON app.reservations (type_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_date
    ON app.notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_reports_reporter
    ON app.support_reports (reported_by_user_id);
CREATE INDEX IF NOT EXISTS idx_support_reports_assignee
    ON app.support_reports (assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_support_reports_trip
    ON app.support_reports (trip_id);
CREATE INDEX IF NOT EXISTS idx_support_reports_status_date
    ON app.support_reports (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_messages_report
    ON app.support_messages (report_id, id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_date
    ON audit.audit_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
    ON audit.audit_logs (entity, entity_id);

COMMIT;
