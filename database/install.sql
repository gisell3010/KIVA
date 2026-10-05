-- Ejecutar con psql, no con el editor de consultas de pgAdmin.
-- La base de datos debe existir y no contener las tablas de KIVA.
\set ON_ERROR_STOP on
\encoding UTF8
\ir scripts/00_create_schemas.sql
\ir scripts/01_create_tables.sql
\ir scripts/02_indexes.sql
\ir seeds/01_expense_categories.sql
\ir seeds/02_reservation_types.sql
\echo 'KIVA: estructura, índices y catálogos instalados.'
