-- Catálogo inicial. Repetir este archivo no duplica nombres existentes.
BEGIN;
INSERT INTO app.expense_categories (name)
VALUES ('Transporte'), ('Alojamiento'), ('Alimentación'), ('Actividades'), ('Otros')
ON CONFLICT (name) DO NOTHING;
COMMIT;
