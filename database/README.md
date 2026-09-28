# Base de datos de KIVA

KIVA significa Kinship, Inspiration, Voyages & Adventures:
vínculos, inspiración, viajes y aventuras.

La base utiliza PostgreSQL y contiene 19 tablas distribuidas en los
esquemas `auth`, `app` y `audit`, 20 índices adicionales y dos catálogos
iniciales.

## Archivos

| Archivo | Función |
|---|---|
| `schema/kiva.dbml` | Modelo de tablas y relaciones. |
| `scripts/00_create_schemas.sql` | Crea los esquemas. |
| `scripts/01_create_tables.sql` | Crea las tablas y sus restricciones. |
| `scripts/02_indexes.sql` | Crea los índices adicionales. |
| `seeds/01_expense_categories.sql` | Inserta cinco categorías de gastos. |
| `seeds/02_reservation_types.sql` | Inserta cinco tipos de reservas. |
| `install.sql` | Ejecuta la instalación mediante psql. |

## Modelo

Los roles globales son `SUPER_ADMIN`, `ADMIN`, `SUPPORT` y `USER`.
Los grupos utilizan `OWNER` y `MEMBER`; los viajes también incluyen
`ORGANIZER`.

Un viaje admite varios destinos. El itinerario se obtiene de las
actividades, ordenadas por fecha y hora. Las reservas son simuladas
y los importes utilizan `DECIMAL(12,2)` en COP.

`auth.auth_sessions` almacena las sesiones, el hash del token de
renovación y sus fechas de vencimiento y revocación. No guarda
el token original.

`app.destination_photos` relaciona cada destino con sus fotografías,
su orden y el usuario que las cargó. Guarda la referencia del archivo;
la imagen se almacena fuera de PostgreSQL.

Los campos `TIMESTAMP` se interpretan en UTC por convención del backend.
Las fechas de las sesiones utilizan `TIMESTAMPTZ`. Las fechas y horas
de actividades representan el horario local acordado para el viaje.

### Votaciones

Un participante puede seleccionar varias opciones de una encuesta.
Cada selección se guarda como una fila en `app.votes`.

`UNIQUE (option_id, user_id)` impide votar dos veces por la misma opción.
La encuesta se identifica mediante `poll_options.poll_id`; ese campo
no se repite en `votes`.

Los resultados no seleccionan destinos automáticamente.

## Instalación

La base debe existir y no contener las tablas de KIVA. Utiliza una
cuenta con permisos para crear los esquemas y las tablas.

En Query Tool de pgAdmin, ejecuta los archivos completos en este orden:

1. `scripts/00_create_schemas.sql`
2. `scripts/01_create_tables.sql`
3. `scripts/02_indexes.sql`
4. `seeds/01_expense_categories.sql`
5. `seeds/02_reservation_types.sql`

Como alternativa, desde la raíz del proyecto y con psql disponible:

```powershell
psql -h localhost -p 5432 -U postgres -d kiva -v ON_ERROR_STOP=1 -f database/install.sql
```

Ajusta los datos de conexión. No ejecutes `install.sql` en Query Tool:
contiene instrucciones propias de psql.

La ejecución se detiene ante un error. Cada archivo tiene su propia
transacción; los anteriores que hayan terminado permanecen aplicados.
Utiliza un solo método de instalación sobre la misma base.

Para las pruebas del backend, instala la misma estructura en
`kiva_test`. Conserva únicamente los catálogos iniciales antes de
ejecutar pytest; no cargues allí los datos de `seed_demo.py`.

La inicialización mediante Docker todavía no está configurada
en el archivo Compose del proyecto.

## Validaciones y cambios

PostgreSQL aplica claves primarias y foráneas, obligatoriedad,
unicidad y las restricciones `CHECK` del SQL. El DBML omite los
`CHECK` para simplificar el diagrama.

El backend valida permisos, pertenencia a grupos y viajes,
propietarios, fechas, votaciones y repartos de gastos. Las operaciones
relacionadas se ejecutan dentro de transacciones.

No se utilizan funciones almacenadas ni triggers. Las notificaciones
y la auditoría se generan desde el backend.

Modificar los scripts de creación no actualiza una base existente.
Los cambios posteriores se gestionarán con Alembic cuando se complete
su configuración.

## Comprobación

```sql
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_schema IN ('auth', 'app', 'audit')
  AND table_type = 'BASE TABLE'
ORDER BY table_schema, table_name;

SELECT COUNT(*) AS expense_categories
FROM app.expense_categories;

SELECT COUNT(*) AS reservation_types
FROM app.reservation_types;
```

Se esperan 19 tablas, cinco categorías de gastos y cinco tipos
de reservas.