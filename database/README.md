# Base de Datos de KIVA

KIVA significa Kinship, Inspiration, Voyages & Adventures:
vínculos, inspiración, viajes y aventuras.

La base de datos utiliza PostgreSQL 16 y contiene 21 tablas de dominio distribuidas en los esquemas `auth`, `app` y `audit`, 25 índices adicionales y dos catálogos iniciales. La tabla técnica `auth.alembic_version` se contabiliza por separado.

## Archivos

| Archivo | Función |
|---|---|
| `schema/kivadb.dbml` | Modelo de tablas y relaciones en formato DBML. |
| `scripts/00_create_schemas.sql` | Crea los esquemas `auth`, `app` y `audit`. |
| `scripts/01_create_tables.sql` | Crea las 21 tablas con sus restricciones. |
| `scripts/02_indexes.sql` | Crea 25 índices adicionales. |
| `docker-init.sh` | Ejecuta la instalación al inicializar un volumen PostgreSQL vacío en Docker. |
| `seeds/01_expense_categories.sql` | Inserta 5 categorías iniciales de gastos. |
| `seeds/02_reservation_types.sql` | Inserta 5 tipos iniciales de reservas. |
| `install.sql` | Ejecuta la instalación completa mediante psql. |

## Modelo

### Esquemas y tablas

**auth** — autenticación y usuarios:

- `users` — Usuarios globales de la plataforma.
- `auth_sessions` — Sesiones de autenticación con refresh token almacenado mediante hash.

**app** — dominio principal:

- `travel_groups` — Grupos de viaje.
- `group_members` — Miembros de grupos (`OWNER`, `MEMBER`).
- `trips` — Viajes pertenecientes a un grupo.
- `trip_members` — Participantes de viajes (`OWNER`, `ORGANIZER`, `MEMBER`).
- `destinations` — Destinos propuestos para cada viaje.
- `destination_photos` — Fotografías asociadas a destinos.
- `activities` — Actividades del itinerario.
- `expenses` — Gastos registrados.
- `expense_splits` — Repartos de gastos entre participantes.
- `expense_categories` — Catálogo de categorías de gastos.
- `reservations` — Reservas simuladas asociadas a los viajes.
- `reservation_types` — Catálogo de tipos de reserva.
- `polls` — Votaciones o encuestas.
- `poll_options` — Opciones disponibles en cada votación.
- `votes` — Votos emitidos por los usuarios.
- `notifications` — Notificaciones personales de los usuarios.
- `support_reports` — Reportes de incidencias creados por usuarios y atendidos por soporte.
- `support_messages` — Conversación de los reportes y notas internas del equipo.

**audit** — auditoría:

- `audit_logs` — Registro de acciones relevantes realizadas en la plataforma.

## Roles

- **Globales:** `SUPER_ADMIN`, `ADMIN`, `SUPPORT`, `USER`.
- **Grupo:** `OWNER`, `MEMBER`.
- **Viaje:** `OWNER`, `ORGANIZER`, `MEMBER`.

## Reglas de negocio principales

1. Un viaje pertenece a un grupo mediante `trips.group_id`.
2. Un viaje puede tener varios destinos propuestos.
3. Un usuario registrado en `trip_members` debe pertenecer al grupo propietario del viaje.
4. Las votaciones permiten seleccionar varias opciones por usuario. La tabla `votes` evita repetir el mismo voto sobre una misma opción mediante la restricción única `(option_id, user_id)`.
5. Los gastos utilizan `DECIMAL(12,2)` y se manejan en COP. Los repartos asociados a un gasto deben corresponder con el total registrado.
6. Los eventos del sistema que representan un instante exacto utilizan `TIMESTAMPTZ`.
7. Las fechas funcionales del viaje utilizan `DATE`.
8. La hora de inicio de una actividad utiliza `TIME` porque representa una hora local acordada.
9. El backend normaliza los instantes del sistema a UTC y el frontend los presenta utilizando la zona horaria del navegador.

## Tipos temporales

### `TIMESTAMPTZ`

Se utiliza para eventos que representan un instante exacto:

- `auth.users.created_at`
- `auth.auth_sessions.created_at`
- `auth.auth_sessions.expires_at`
- `auth.auth_sessions.revoked_at`
- `app.travel_groups.created_at`
- `app.group_members.joined_at`
- `app.trips.created_at`
- `app.destination_photos.created_at`
- `app.polls.closes_at`
- `app.votes.voted_at`
- `app.notifications.created_at`
- `app.support_reports.created_at`
- `app.support_reports.updated_at`
- `app.support_reports.resolved_at`
- `app.support_messages.created_at`
- `audit.audit_logs.created_at`

### `DATE`

Se utiliza para fechas funcionales del viaje:

- `app.trips.start_date`
- `app.trips.end_date`
- `app.activities.activity_date`
- `app.expenses.expense_date`
- `app.reservations.reservation_date`

### `TIME`

Se utiliza para la hora local de una actividad:

- `app.activities.start_time`

## Creación de las bases

Se recomienda utilizar un usuario de PostgreSQL dedicado para KIVA en lugar de conectar la aplicación con el superusuario `postgres`.

Desde una sesión administrativa de PostgreSQL:

```sql
CREATE ROLE kiva_user WITH LOGIN PASSWORD 'TU_PASSWORD_SEGURA';
CREATE DATABASE kivadb OWNER kiva_user;
CREATE DATABASE kivadb_test OWNER kiva_user;
```

Si el rol `kiva_user` ya existe, crea únicamente las bases que falten.

## Instalación

La base debe existir previamente y no contener las tablas de KIVA. El usuario utilizado debe tener permisos para crear esquemas, tablas, restricciones e índices dentro de esa base.

### Método 1: psql (recomendado)

Desde la raíz del proyecto:

```powershell
psql -h localhost -p 5432 -U kiva_user -d kivadb -v ON_ERROR_STOP=1 -f database/install.sql
```

El archivo `install.sql` ejecuta en orden:

```text
scripts/00_create_schemas.sql
scripts/01_create_tables.sql
scripts/02_indexes.sql
seeds/01_expense_categories.sql
seeds/02_reservation_types.sql
```

### Método 2: Query Tool de pgAdmin

Ejecuta manualmente los archivos completos en este orden:

```text
1. scripts/00_create_schemas.sql
2. scripts/01_create_tables.sql
3. scripts/02_indexes.sql
4. seeds/01_expense_categories.sql
5. seeds/02_reservation_types.sql
```

No ejecutes `install.sql` desde Query Tool porque contiene metacomandos propios de psql como `\ir`.

Cada archivo administra su propia transacción. Los scripts que hayan terminado correctamente permanecen aplicados si ocurre un error en un archivo posterior.

## Base de datos para pruebas

Instala la misma estructura en `kivadb_test`:

```powershell
psql -h localhost -p 5432 -U kiva_user -d kivadb_test -v ON_ERROR_STOP=1 -f database/install.sql
```

La base de pruebas debe conservar únicamente la estructura y los catálogos iniciales antes de ejecutar pytest. Cada prueba administra sus propios datos de forma aislada.

## Migraciones con Alembic

La configuración se encuentra en `backend/alembic/` y `backend/alembic.ini`. La tabla de control de versiones se ubica en `auth.alembic_version`.

La estructura inicial continúa definida por `database/install.sql`. La revisión `20261007_support` aplica la actualización de soporte a una base KIVA instalada; no crea todo el esquema desde cero. Desde `backend/`, con `.env` apuntando a la base de destino:

```powershell
alembic upgrade head
alembic current
```

Las bases existentes se actualizan mediante Alembic, previo respaldo. `install.sql` se reserva para bases vacías y ya incluye el esquema completo. Después de una instalación nueva, `alembic upgrade head` registra la revisión; las operaciones de esa revisión admiten la estructura ya creada.

Los cambios posteriores de estructura deben gestionarse mediante nuevas migraciones de Alembic en lugar de editar directamente una base ya desplegada. Consultar [Migraciones](../backend/alembic/README).

## Validaciones y restricciones

PostgreSQL aplica directamente:

- claves primarias y foráneas;
- obligatoriedad mediante `NOT NULL`;
- unicidad mediante `UNIQUE`;
- restricciones `CHECK` para roles, estados, fechas, posiciones y montos;
- acciones referenciales `CASCADE`, `RESTRICT` y `SET NULL` según la relación.

El backend valida adicionalmente:

- permisos por rol global y contextual;
- pertenencia a grupos y viajes;
- propietarios y transferencias;
- coherencia entre fechas de viaje;
- participantes válidos en gastos y repartos;
- reglas de votación;
- permisos sobre destinos, fotografías, actividades y reservas.

No se utilizan funciones almacenadas ni triggers para la lógica de negocio. Las notificaciones y los registros de auditoría se generan desde el backend.

## Comprobación

Para comprobar las tablas:

```sql
SELECT
    table_schema,
    table_name
FROM information_schema.tables
WHERE table_schema IN ('auth', 'app', 'audit')
  AND table_type = 'BASE TABLE'
ORDER BY table_schema, table_name;
```

Para comprobar los catálogos:

```sql
SELECT COUNT(*) AS expense_categories
FROM app.expense_categories;

SELECT COUNT(*) AS reservation_types
FROM app.reservation_types;
```

Se esperan 21 tablas de dominio, 5 categorías de gastos y 5 tipos de reservas. Si se ha ejecutado Alembic, la consulta también muestra `auth.alembic_version`.

Para comprobar los tipos temporales:

```sql
SELECT
    table_schema,
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema IN ('auth', 'app', 'audit')
  AND column_name IN (
      'created_at',
      'expires_at',
      'revoked_at',
      'joined_at',
      'closes_at',
      'voted_at',
      'start_date',
      'end_date',
      'activity_date',
      'start_time',
      'expense_date',
      'reservation_date'
  )
ORDER BY table_schema, table_name, ordinal_position;
```

Los eventos del sistema deben aparecer como `timestamp with time zone`, las fechas funcionales como `date` y `app.activities.start_time` como `time without time zone`.

## Diagramas

- [Modelo DBML](schema/kivadb.dbml) importable en dbdiagram.io.
- [Diagrama entidad-relación en PDF](../docs/database/KIVA.pdf).
- [Diagrama entidad-relación en PNG](../docs/database/KIVA.png).

Cuando se modifique el DBML, los archivos PDF y PNG deben regenerarse para que la documentación gráfica permanezca sincronizada.
