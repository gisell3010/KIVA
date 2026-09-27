-- ================================================================
-- KIVA
-- 00_create_schemas.sql
-- Creación de los esquemas de cuentas, aplicación y auditoría
-- ================================================================

BEGIN;

CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS app;
CREATE SCHEMA IF NOT EXISTS audit;

COMMIT;