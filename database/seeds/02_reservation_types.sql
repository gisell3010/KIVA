-- Reservas simuladas; no realiza compras ni reservas externas.
BEGIN;
INSERT INTO app.reservation_types (name)
VALUES ('Alojamiento'), ('Transporte'), ('Actividad'), ('Restaurante'), ('Otro')
ON CONFLICT (name) DO NOTHING;
COMMIT;
