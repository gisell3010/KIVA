-- Actualización aditiva: conserva usuarios, viajes, imágenes y reportes.
CREATE TABLE IF NOT EXISTS app.support_reports (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    reported_by_user_id INTEGER,
    assigned_to_user_id INTEGER,
    trip_id INTEGER,
    contact_email VARCHAR(150) NOT NULL,
    category VARCHAR(30) NOT NULL,
    subject VARCHAR(150) NOT NULL,
    description VARCHAR(1000) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    response VARCHAR(1000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMPTZ,
    CONSTRAINT chk_support_reports_category
        CHECK (
            category IN (
                'ACCESS',
                'ACCOUNT',
                'TRIP',
                'EXPENSE',
                'VOTING',
                'RESERVATION',
                'TECHNICAL',
                'OTHER'
            )
        ),
    CONSTRAINT chk_support_reports_status
        CHECK (
            status IN (
                'OPEN',
                'IN_REVIEW',
                'ESCALATED',
                'RESOLVED',
                'CLOSED'
            )
        ),
    CONSTRAINT fk_support_reports_reported_by
        FOREIGN KEY (reported_by_user_id)
        REFERENCES auth.users(id)
        ON DELETE SET NULL,
    CONSTRAINT fk_support_reports_assigned_to
        FOREIGN KEY (assigned_to_user_id)
        REFERENCES auth.users(id)
        ON DELETE SET NULL,
    CONSTRAINT fk_support_reports_trip
        FOREIGN KEY (trip_id)
        REFERENCES app.trips(id)
        ON DELETE SET NULL
);


ALTER TABLE app.support_reports ADD COLUMN IF NOT EXISTS tracking_token_hash VARCHAR(64);
ALTER TABLE app.notifications ADD COLUMN IF NOT EXISTS action_path VARCHAR(200);
CREATE TABLE IF NOT EXISTS app.support_messages (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    report_id INTEGER NOT NULL REFERENCES app.support_reports(id) ON DELETE CASCADE,
    author_id INTEGER REFERENCES auth.users(id) ON DELETE SET NULL,
    author_label VARCHAR(150) NOT NULL,
    body VARCHAR(1000) NOT NULL,
    is_internal BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_support_messages_report ON app.support_messages(report_id, id);
CREATE INDEX IF NOT EXISTS idx_support_reports_reporter ON app.support_reports(reported_by_user_id);
CREATE INDEX IF NOT EXISTS idx_support_reports_assignee ON app.support_reports(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_support_reports_trip ON app.support_reports(trip_id);
CREATE INDEX IF NOT EXISTS idx_support_reports_status_date ON app.support_reports(status, created_at DESC);
-- Conserva la última respuesta anterior como primer mensaje público.
INSERT INTO app.support_messages(report_id, author_id, author_label, body, created_at)
SELECT r.id, NULL, 'Equipo de soporte', r.response, r.updated_at
FROM app.support_reports r
WHERE r.response IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM app.support_messages m WHERE m.report_id = r.id
);
-- Los escalados anteriores deben llegar a administración, sin conservar al agente de soporte.
UPDATE app.support_reports r SET assigned_to_user_id = NULL
FROM auth.users u WHERE r.status = 'ESCALATED' AND r.assigned_to_user_id = u.id AND u.role = 'SUPPORT';
