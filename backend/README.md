# Backend de KIVA

API REST de KIVA para la organización de viajes grupales. Está desarrollada con Python 3.14, FastAPI, SQLAlchemy 2.0 y PostgreSQL.

El frontend Angular consume la API mediante el prefijo `/api`.

## Requisitos

- Python 3.14.
- PostgreSQL 16 o compatible.
- `pip`.

## Instalación local

Desde la raíz del proyecto:

```powershell
cd backend
py -3.14 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
Copy-Item .env.example .env
```

Configurar en `backend/.env`, como mínimo:

```env
APP_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kivadb
DB_USER=kiva_user
DB_PASSWORD=TU_PASSWORD
JWT_SECRET=TU_SECRETO_DE_AL_MENOS_32_CARACTERES
IMAGE_STORAGE=local
```

La base `kivadb` debe existir previamente y contener la estructura descrita en `database/README.md`.

En desarrollo, `IMAGE_STORAGE=local` almacena las imágenes en `backend/uploads/`. Para producción puede utilizarse `IMAGE_STORAGE=cloudinary` junto con las credenciales correspondientes.

## Ejecución

```powershell
python -m uvicorn app.main:app --reload
```

Servicios locales:

```text
API:        http://localhost:8000/api
Swagger UI: http://localhost:8000/api/docs
```

## Administración inicial

El primer `SUPER_ADMIN` se crea mediante:

```powershell
python -m scripts.create_superadmin
```

Las cuentas creadas mediante el registro público reciben inicialmente el rol `USER`.

El `SUPER_ADMIN` puede asignar posteriormente los roles globales `ADMIN` y `SUPPORT` desde la gestión de usuarios.

Los roles contextuales de grupos y viajes son independientes del rol global.

## Modelo de permisos

### Roles globales

| Rol | Responsabilidad |
|---|---|
| `USER` | Uso general de KIVA |
| `SUPPORT` | Consulta y diagnóstico de incidencias |
| `ADMIN` | Operación y supervisión de la plataforma |
| `SUPER_ADMIN` | Seguridad, roles globales y control técnico |

Los roles administrativos no conceden permisos automáticos sobre grupos o viajes privados.

### Roles contextuales

```text
Grupo:
OWNER
MEMBER

Viaje:
OWNER
ORGANIZER
MEMBER
```

Los permisos dentro de grupos y viajes se determinan mediante `group_members` y `trip_members`.

## Pruebas

Crear la configuración de pruebas:

```powershell
Copy-Item .env.test.example .env.test
```

La base de pruebas debe utilizar una base independiente, por ejemplo:

```env
APP_ENV=test
DB_NAME=kivadb_test
DB_USER=kiva_user
```

Ejecutar:

```powershell
$env:KIVA_ENV_FILE=".env.test"
pytest --cov=app --cov-report=term-missing
Remove-Item Env:KIVA_ENV_FILE
```

## Docker

Desde `backend/`:

```powershell
docker build -t kiva-backend .
docker run --name kiva-api --env-file .env -e DB_HOST=host.docker.internal -p 127.0.0.1:8000:8000 -v kiva_uploads:/app/uploads kiva-backend
```

Para el entorno completo se dispone de `docker-compose.yml` en la raíz del proyecto.

La configuración de producción se documenta en:

```text
deploy/render/README.md
```

## Arquitectura

```text
backend/
├── app/
│   ├── api/              # Routers y endpoints REST
│   ├── core/             # Configuración, seguridad y permisos
│   ├── db/               # Engine y sesiones de SQLAlchemy
│   ├── models/           # Modelos de persistencia
│   ├── schemas/          # Esquemas Pydantic
│   ├── services/         # Lógica de negocio
│   └── storage/          # Gestión de imágenes
├── alembic/              # Configuración de migraciones
├── scripts/              # Utilidades administrativas
├── tests/                # Pruebas automatizadas
├── requirements.txt
└── requirements-dev.txt
```

## Endpoints principales

| Recurso | Prefijo |
|---|---|
| Auth | `/api/auth` |
| Users | `/api/users` |
| Groups | `/api/groups` |
| Trips | `/api/trips` |
| Destinations | `/api/trips/{trip_id}/destinations` |
| Activities | `/api/trips/{trip_id}/activities` |
| Expenses | `/api/trips/{trip_id}/expenses` |
| Polls | `/api/trips/{trip_id}/polls` |
| Reservations | `/api/trips/{trip_id}/reservations` |
| Notifications | `/api/notifications` |
| Calendar | `/api/calendar` |
| Dashboard | `/api/dashboard` |
| Admin | `/api/admin` |
| Support | `/api/support` |
| SuperAdmin | `/api/super-admin` |

## Migraciones

La estructura inicial se instala mediante:

```text
database/install.sql
```

Alembic está configurado, pero `alembic/versions/` todavía no contiene una línea base equivalente al esquema inicial.

Los cambios posteriores podrán gestionarse mediante:

```powershell
alembic revision --autogenerate -m "descripcion_cambio"
alembic upgrade head
```

Más información:

```text
alembic/README
```

## Archivos privados

No forman parte del repositorio:

```text
backend/.env
backend/.env.test
backend/.venv/
backend/uploads/
**/__pycache__/
```

Tampoco deben almacenarse contraseñas, secretos JWT, credenciales externas ni respaldos de PostgreSQL.

Las plantillas `.env.example` y `.env.test.example` sí se conservan en Git.

## Uso académico

KIVA es un proyecto académico orientado al desarrollo de una plataforma web completa con API REST, persistencia relacional, autenticación, autorización, pruebas y despliegue.