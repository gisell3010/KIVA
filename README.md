# KIVA — Plataforma de Organización de Viajes Grupales

**Kinship, Inspiration, Voyages & Adventures**

KIVA es una plataforma full-stack para organizar viajes en grupo. Permite gestionar grupos, participantes, viajes, destinos, actividades, gastos, votaciones, reservas simuladas, calendario y notificaciones desde una misma aplicación.

## Stack tecnológico

- **Frontend:** Angular 18 con componentes standalone, Signals y control flow.
- **Backend:** FastAPI con Python 3.14 y SQLAlchemy 2.0.
- **Base de datos:** PostgreSQL 16.
- **Autenticación:** JWT con access token y refresh token persistido mediante hash.
- **Contenedores:** Docker y Docker Compose.
- **Despliegue público:** Render (Static Site para Angular, Web Service Docker para FastAPI y Render Postgres) + Cloudinary Free para imágenes.
- **Alternativa de producción:** Docker Compose + Nginx para VPS o servidor propio.
- **Pruebas:** pytest para backend y Playwright para frontend E2E.

## Módulos principales

### Espacio de usuario

- **Dashboard:** resumen de grupos, viajes, actividades, gastos, votaciones y notificaciones.
- **Grupos:** creación y gestión de grupos de viaje según el rol contextual del usuario.
- **Viajes:** planificación de viajes pertenecientes a un grupo.
- **Participantes:** consulta y gestión de miembros según los permisos del viaje.
- **Destinos:** propuestas, fotografías y selección de destinos.
- **Itinerario:** actividades con fecha, hora local, ubicación, costo estimado y estado.
- **Gastos:** registro de gastos, repartos y balances internos en COP.
- **Votaciones:** encuestas con selección múltiple y fecha límite opcional.
- **Reservas:** registro de reservas simuladas asociadas al viaje.
- **Calendario:** vista unificada de fechas del viaje, actividades, gastos, reservas y cierres de votaciones.
- **Notificaciones:** notificaciones persistidas dentro de la plataforma.
- **Perfil:** información personal, fotografía y sesiones activas.
- **Configuración:** tema visual y opciones de accesibilidad.

### Administración

- **Dashboard administrativo:** métricas agregadas de usuarios, grupos, viajes, gastos, reservas y votaciones.
- **Usuarios:** búsqueda, filtrado, consulta y cambio de estado de cuentas `USER`.
- **Grupos:** consulta global de grupos en modo de supervisión.
- **Viajes:** consulta global de viajes en modo de supervisión.
- **Visión general:** distribución de usuarios y estados de viajes.

La administración de la plataforma no reemplaza los permisos contextuales de los propietarios y organizadores de grupos o viajes.

### Soporte

- **Panel de soporte:** resumen del estado de las cuentas.
- **Consulta de usuarios:** búsqueda y visualización de información de cuenta en modo de solo lectura.

### Superadministración

- **Dashboard global:** métricas administrativas.
- **Configuración efectiva:** consulta de parámetros efectivos del backend en modo de solo lectura.
- **Auditoría:** consulta de registros almacenados en `audit.audit_logs`.
- **Salud del sistema:** comprobación de disponibilidad de la API y de PostgreSQL.
- **Usuarios:** gestión de roles y estados con protección del último `SUPER_ADMIN` activo.

## Modelo de roles

KIVA separa los permisos globales de los permisos contextuales.

### Roles globales

- `SUPER_ADMIN`
- `ADMIN`
- `SUPPORT`
- `USER`

### Roles de grupo

- `OWNER`
- `MEMBER`

### Roles de viaje

- `OWNER`
- `ORGANIZER`
- `MEMBER`

Un rol global no concede automáticamente permisos de edición dentro de un grupo o viaje. Un administrador de la plataforma puede participar en un viaje privado y sus acciones dentro de ese viaje dependen de su rol contextual.

## Base de datos

La base utiliza tres esquemas:

- `auth` — usuarios y sesiones.
- `app` — dominio principal de KIVA.
- `audit` — auditoría.

El modelo actual contiene 19 tablas, 20 índices adicionales y dos catálogos iniciales. La estructura inicial se instala mediante `database/install.sql`. Alembic está configurado para gestionar cambios incrementales una vez se establezca la línea base de migraciones.

Los eventos del sistema utilizan `TIMESTAMPTZ`, las fechas funcionales del viaje utilizan `DATE` y la hora local de las actividades utiliza `TIME`.

## Desarrollo local con Docker Compose

Desde la raíz del proyecto:

```powershell
Copy-Item .env.example .env
```

Completa `POSTGRES_PASSWORD` y `JWT_SECRET` en `.env`. El secreto JWT debe tener al menos 32 caracteres.

Luego ejecuta:

```powershell
docker compose up -d --build
```

Servicios:

```text
Frontend:    http://localhost:4200
Backend API: http://localhost:8000/api
Swagger UI:  http://localhost:8000/api/docs
PostgreSQL:  localhost:5432
```

Los scripts de `database/` se ejecutan automáticamente únicamente cuando el volumen de PostgreSQL se inicializa por primera vez.

## Desarrollo local sin Docker

### Base de datos

Crea un usuario dedicado y las bases de desarrollo y pruebas desde una sesión administrativa de PostgreSQL:

```sql
CREATE ROLE kiva_user WITH LOGIN PASSWORD 'TU_PASSWORD_SEGURA';
CREATE DATABASE kivadb OWNER kiva_user;
CREATE DATABASE kivadb_test OWNER kiva_user;
```

Si `kiva_user` ya existe, no vuelvas a crear el rol.

Instala la estructura principal:

```powershell
psql -h localhost -p 5432 -U kiva_user -d kivadb -v ON_ERROR_STOP=1 -f database/install.sql
```

Instala la misma estructura en la base de pruebas:

```powershell
psql -h localhost -p 5432 -U kiva_user -d kivadb_test -v ON_ERROR_STOP=1 -f database/install.sql
```

### Backend

```powershell
cd backend
py -3.14 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
Copy-Item .env.example .env
```

Completa `DB_PASSWORD` y `JWT_SECRET` en `backend/.env` y ejecuta:

```powershell
python -m uvicorn app.main:app --reload
```

### Frontend

```powershell
cd frontend
npm ci
npm start
```

## Variables de entorno

### Raíz: `.env`

```env
POSTGRES_DB=kivadb
POSTGRES_USER=kiva_user
POSTGRES_PASSWORD=change_this_password
JWT_SECRET=change_this_for_a_secure_secret_of_at_least_32_chars
```

### Backend: `backend/.env`

```env
APP_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kivadb
DB_USER=kiva_user
DB_PASSWORD=change_this_password
JWT_SECRET=change_this_for_a_secure_secret_of_at_least_32_chars
CORS_ORIGINS=["http://localhost:4200","http://127.0.0.1:4200"]
ALLOWED_HOSTS=["localhost","127.0.0.1","testserver"]
```

Los archivos `.env` y `.env.test` son privados y no deben subirse al repositorio.

## Pruebas

### Backend

```powershell
cd backend
Copy-Item .env.test.example .env.test
$env:KIVA_ENV_FILE = ".env.test"
pytest --cov=app --cov-report=term-missing
Remove-Item Env:KIVA_ENV_FILE
```

La base configurada para las pruebas debe ser `kivadb_test` y debe tener instalada la estructura de `database/install.sql`.

### Frontend E2E

```powershell
cd frontend
npx playwright install
npm run e2e
```

El frontend y el backend deben estar disponibles durante las pruebas E2E según la configuración de Playwright.

## Despliegue

El despliegue público principal se realiza en Render: Angular como Static Site, FastAPI como Web Service Docker y PostgreSQL mediante Render Postgres. Para mantener el despliegue académico completamente gratuito, las imágenes se almacenan en Cloudinary Free; PostgreSQL conserva la referencia y FastAPI mantiene el control de subida, validación y acceso. Consulta `deploy/render/README.md`.

La configuración Docker Compose + Nginx se conserva en `deploy/` únicamente como alternativa para un VPS o servidor propio.

## Estructura del proyecto

```text
KIVA/
├── frontend/                 # Angular
├── backend/                  # FastAPI y SQLAlchemy
│   ├── app/
│   │   ├── api/              # Endpoints REST
│   │   ├── core/             # Configuración, seguridad y permisos
│   │   ├── db/               # Sesión y base declarativa
│   │   ├── models/           # Modelos SQLAlchemy
│   │   ├── schemas/          # Esquemas Pydantic
│   │   ├── services/         # Lógica de negocio
│   │   └── storage/          # Almacenamiento de imágenes
│   ├── alembic/              # Configuración de migraciones
│   ├── scripts/              # Scripts de administración y datos demo
│   └── tests/                # Pruebas pytest
├── database/                 # DBML, SQL, índices y catálogos
├── deploy/                   # Render + Cloudinary principal; Docker/Nginx alternativo
├── docs/                     # Diagramas y documentación gráfica
└── docker-compose.yml        # Entorno local con Docker
```

## Estado funcional actual

El proyecto dispone de autenticación, sesiones, permisos globales y contextuales, persistencia PostgreSQL, servicios REST para los recursos principales, almacenamiento de imágenes, notificaciones internas, calendario, auditoría, paneles administrativos, configuración de Docker y pruebas automatizadas en el repositorio.

La lógica administrativa de plataforma se mantiene separada de las decisiones de los propietarios y organizadores de cada grupo o viaje.

## Licencia

Proyecto privado