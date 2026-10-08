-- ================================================================
-- KIVA
-- 01_create_tables.sql
-- Creación de tablas
-- ================================================================

BEGIN;

-- ================================================================
-- SCHEMA: AUTH
-- ================================================================

-- ----------------------------------------------------------------
-- USERS
-- Cuentas de usuario de la plataforma.
-- ----------------------------------------------------------------
CREATE TABLE auth.users (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'USER',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    profile_image VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_users_role
        CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'SUPPORT', 'USER')),
    CONSTRAINT chk_users_status
        CHECK (status IN ('ACTIVE', 'SUSPENDED'))
);

-- ----------------------------------------------------------------
-- AUTH SESSIONS
-- Sesiones de autenticación de los usuarios.
-- ----------------------------------------------------------------
CREATE TABLE auth.auth_sessions (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INTEGER NOT NULL,
    refresh_token_hash VARCHAR(64) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    CONSTRAINT fk_auth_sessions_user
        FOREIGN KEY (user_id)
        REFERENCES auth.users(id)
        ON DELETE CASCADE
);

-- ================================================================
-- SCHEMA: APP
-- ================================================================

-- ----------------------------------------------------------------
-- TRAVEL GROUPS
-- Grupos de usuarios que pueden organizar uno o varios viajes.
-- ----------------------------------------------------------------
CREATE TABLE app.travel_groups (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    description VARCHAR(300),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------
-- GROUP MEMBERS
-- Relaciona usuarios con grupos.
-- ----------------------------------------------------------------
CREATE TABLE app.group_members (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    group_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'MEMBER',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_group_members
        UNIQUE (group_id, user_id),
    CONSTRAINT chk_group_members_role
        CHECK (role IN ('OWNER', 'MEMBER')),
    CONSTRAINT fk_group_members_group
        FOREIGN KEY (group_id)
        REFERENCES app.travel_groups(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_group_members_user
        FOREIGN KEY (user_id)
        REFERENCES auth.users(id)
        ON DELETE RESTRICT
);

-- ----------------------------------------------------------------
-- TRIPS
-- Viajes organizados por un grupo.
-- ----------------------------------------------------------------
CREATE TABLE app.trips (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    group_id INTEGER NOT NULL,
    name VARCHAR(150) NOT NULL,
    description VARCHAR(300),
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'PLANNING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_trips_status
        CHECK (
            status IN (
                'PLANNING',
                'CONFIRMED',
                'COMPLETED',
                'CANCELLED'
            )
        ),
    CONSTRAINT chk_trips_dates
        CHECK (
            end_date IS NULL
            OR (
                start_date IS NOT NULL
                AND end_date >= start_date
            )
        ),
    CONSTRAINT fk_trips_group
        FOREIGN KEY (group_id)
        REFERENCES app.travel_groups(id)
        ON DELETE RESTRICT
);

-- ----------------------------------------------------------------
-- TRIP MEMBERS
-- Usuarios que participan específicamente en un viaje.
-- ----------------------------------------------------------------
CREATE TABLE app.trip_members (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    trip_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'MEMBER',
    CONSTRAINT uq_trip_members
        UNIQUE (trip_id, user_id),
    CONSTRAINT chk_trip_members_role
        CHECK (role IN ('OWNER', 'ORGANIZER', 'MEMBER')),
    CONSTRAINT fk_trip_members_trip
        FOREIGN KEY (trip_id)
        REFERENCES app.trips(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_trip_members_user
        FOREIGN KEY (user_id)
        REFERENCES auth.users(id)
        ON DELETE RESTRICT
);

-- ----------------------------------------------------------------
-- DESTINATIONS
-- Destinos propuestos o seleccionados para un viaje.
-- ----------------------------------------------------------------
CREATE TABLE app.destinations (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    trip_id INTEGER NOT NULL,
    proposed_by_user_id INTEGER NOT NULL,
    country VARCHAR(100) NOT NULL,
    place_name VARCHAR(150) NOT NULL,
    description VARCHAR(300),
    is_selected BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_destinations_trip
        FOREIGN KEY (trip_id)
        REFERENCES app.trips(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_destinations_user
        FOREIGN KEY (proposed_by_user_id)
        REFERENCES auth.users(id)
        ON DELETE RESTRICT
);

-- ----------------------------------------------------------------
-- DESTINATION PHOTOS
-- Fotografías asociadas a los destinos.
-- ----------------------------------------------------------------
CREATE TABLE app.destination_photos (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    destination_id INTEGER NOT NULL,
    uploaded_by_user_id INTEGER NOT NULL,
    file_path VARCHAR(255) NOT NULL UNIQUE,
    position INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_destination_photos_position
        UNIQUE (destination_id, position),
    CONSTRAINT chk_destination_photos_position
        CHECK (position > 0),
    CONSTRAINT fk_destination_photos_destination
        FOREIGN KEY (destination_id)
        REFERENCES app.destinations(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_destination_photos_user
        FOREIGN KEY (uploaded_by_user_id)
        REFERENCES auth.users(id)
        ON DELETE RESTRICT
);

-- ----------------------------------------------------------------
-- ACTIVITIES
-- Actividades que conforman el itinerario de un viaje.
-- ----------------------------------------------------------------
CREATE TABLE app.activities (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    trip_id INTEGER NOT NULL,
    title VARCHAR(150) NOT NULL,
    description VARCHAR(300),
    location VARCHAR(150),
    activity_date DATE NOT NULL,
    start_time TIME,
    estimated_cost DECIMAL(12,2),
    status VARCHAR(20) NOT NULL DEFAULT 'PROPOSED',
    CONSTRAINT chk_activities_cost
        CHECK (
            estimated_cost IS NULL
            OR estimated_cost >= 0
        ),
    CONSTRAINT chk_activities_status
        CHECK (
            status IN (
                'PROPOSED',
                'APPROVED',
                'CANCELLED'
            )
        ),
    CONSTRAINT fk_activities_trip
        FOREIGN KEY (trip_id)
        REFERENCES app.trips(id)
        ON DELETE CASCADE
);

-- ----------------------------------------------------------------
-- EXPENSE CATEGORIES
-- Catálogo de categorías para clasificar los gastos.
-- ----------------------------------------------------------------
CREATE TABLE app.expense_categories (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(80) NOT NULL UNIQUE
);

-- ----------------------------------------------------------------
-- EXPENSES
-- Gastos registrados dentro de un viaje.
-- ----------------------------------------------------------------
CREATE TABLE app.expenses (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    trip_id INTEGER NOT NULL,
    paid_by_user_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    title VARCHAR(150) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    expense_date DATE NOT NULL,
    CONSTRAINT chk_expenses_amount
        CHECK (amount > 0),
    CONSTRAINT fk_expenses_trip
        FOREIGN KEY (trip_id)
        REFERENCES app.trips(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_expenses_user
        FOREIGN KEY (paid_by_user_id)
        REFERENCES auth.users(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_expenses_category
        FOREIGN KEY (category_id)
        REFERENCES app.expense_categories(id)
        ON DELETE RESTRICT
);

-- ----------------------------------------------------------------
-- EXPENSE SPLITS
-- División de un gasto entre los participantes.
-- ----------------------------------------------------------------
CREATE TABLE app.expense_splits (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    expense_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    CONSTRAINT uq_expense_splits
        UNIQUE (expense_id, user_id),
    CONSTRAINT chk_expense_splits_amount
        CHECK (amount > 0),
    CONSTRAINT fk_expense_splits_expense
        FOREIGN KEY (expense_id)
        REFERENCES app.expenses(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_expense_splits_user
        FOREIGN KEY (user_id)
        REFERENCES auth.users(id)
        ON DELETE RESTRICT
);

-- ----------------------------------------------------------------
-- POLLS
-- Encuestas o votaciones relacionadas con un viaje.
-- ----------------------------------------------------------------
CREATE TABLE app.polls (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    trip_id INTEGER NOT NULL,
    question VARCHAR(250) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    closes_at TIMESTAMPTZ,
    CONSTRAINT chk_polls_status
        CHECK (status IN ('OPEN', 'CLOSED')),
    CONSTRAINT fk_polls_trip
        FOREIGN KEY (trip_id)
        REFERENCES app.trips(id)
        ON DELETE CASCADE
);

-- ----------------------------------------------------------------
-- POLL OPTIONS
-- Opciones disponibles dentro de cada encuesta.
-- ----------------------------------------------------------------
CREATE TABLE app.poll_options (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    poll_id INTEGER NOT NULL,
    option_number INTEGER NOT NULL,
    option_text VARCHAR(200) NOT NULL,
    CONSTRAINT uq_poll_options_number
        UNIQUE (poll_id, option_number),
    CONSTRAINT chk_poll_options_number
        CHECK (option_number > 0),
    CONSTRAINT fk_poll_options_poll
        FOREIGN KEY (poll_id)
        REFERENCES app.polls(id)
        ON DELETE CASCADE
);

-- ----------------------------------------------------------------
-- VOTES
-- Cada fila registra el voto de un usuario por una opción.
-- ----------------------------------------------------------------
CREATE TABLE app.votes (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INTEGER NOT NULL,
    option_id INTEGER NOT NULL,
    voted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_votes_option_user
        UNIQUE (option_id, user_id),
    CONSTRAINT fk_votes_user
        FOREIGN KEY (user_id)
        REFERENCES auth.users(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_votes_option
        FOREIGN KEY (option_id)
        REFERENCES app.poll_options(id)
        ON DELETE CASCADE
);

-- ----------------------------------------------------------------
-- RESERVATION TYPES
-- Catálogo con los tipos de reserva disponibles.
-- ----------------------------------------------------------------
CREATE TABLE app.reservation_types (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(80) NOT NULL UNIQUE
);

-- ----------------------------------------------------------------
-- RESERVATIONS
-- Reservas simuladas asociadas a los viajes.
-- ----------------------------------------------------------------
CREATE TABLE app.reservations (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    trip_id INTEGER NOT NULL,
    type_id INTEGER NOT NULL,
    title VARCHAR(150) NOT NULL,
    provider VARCHAR(150),
    reservation_date DATE,
    amount DECIMAL(12,2),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    CONSTRAINT chk_reservations_amount
        CHECK (
            amount IS NULL
            OR amount >= 0
        ),
    CONSTRAINT chk_reservations_status
        CHECK (
            status IN (
                'PENDING',
                'CONFIRMED',
                'CANCELLED'
            )
        ),
    CONSTRAINT fk_reservations_trip
        FOREIGN KEY (trip_id)
        REFERENCES app.trips(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_reservations_type
        FOREIGN KEY (type_id)
        REFERENCES app.reservation_types(id)
        ON DELETE RESTRICT
);

-- ----------------------------------------------------------------
-- NOTIFICATIONS
-- Notificaciones personales de cada usuario.
-- ----------------------------------------------------------------
CREATE TABLE app.notifications (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title VARCHAR(150) NOT NULL,
    message VARCHAR(300) NOT NULL,
    action_path VARCHAR(200),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notifications_user
        FOREIGN KEY (user_id)
        REFERENCES auth.users(id)
        ON DELETE CASCADE
);

-- ----------------------------------------------------------------
-- SUPPORT REPORTS
-- Reportes enviados por usuarios y gestionados por soporte.
-- ----------------------------------------------------------------
CREATE TABLE app.support_reports (
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
    tracking_token_hash VARCHAR(64),
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

-- ----------------------------------------------------------------
-- SUPPORT MESSAGES
-- Mensajes públicos y notas internas asociados a un reporte.
-- ----------------------------------------------------------------
CREATE TABLE app.support_messages (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    report_id INTEGER NOT NULL,
    author_id INTEGER,
    author_label VARCHAR(150) NOT NULL,
    body VARCHAR(1000) NOT NULL,
    is_internal BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_support_messages_report
        FOREIGN KEY (report_id)
        REFERENCES app.support_reports(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_support_messages_author
        FOREIGN KEY (author_id)
        REFERENCES auth.users(id)
        ON DELETE SET NULL
);

-- ================================================================
-- SCHEMA: AUDIT
-- ================================================================

-- ----------------------------------------------------------------
-- AUDIT LOGS
-- Registro de acciones relevantes realizadas dentro del sistema.
-- ----------------------------------------------------------------
CREATE TABLE audit.audit_logs (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INTEGER,
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(80),
    entity_id INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_logs_user
        FOREIGN KEY (user_id)
        REFERENCES auth.users(id)
        ON DELETE SET NULL
);

COMMIT;
