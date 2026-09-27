# Backend de KIVA

API para organizar viajes en grupo con familiares, amigos y compañeros.
Desarrollada con Python 3.14, FastAPI, SQLAlchemy y PostgreSQL.
El frontend utiliza Angular y consume las rutas bajo `/api`.

## Configuración local

Ejecuta los comandos desde `backend`.

Si todavía no tienes un entorno virtual:

```powershell
py -3.14 -m venv .venv
```

Activa el entorno e instala las dependencias:

```powershell
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements-dev.txt
```

Copia `.env.example` como `.env` si este último no existe. Completa
`DB_PASSWORD` y `JWT_SECRET`, y ajusta la conexión a PostgreSQL.

La base `kiva` debe existir y tener instalada la estructura descrita
en `database/README.md`. El backend no crea las tablas al iniciar.

## Ejecución

```powershell
python -m uvicorn app.main:app --reload
```

La API se ejecuta en `http://localhost:8000`.
La documentación interactiva está disponible en `/docs`.

## Cuentas y datos de prueba

Para crear el superadministrador:

```powershell
python -m scripts.create_superadmin
```

Para cargar datos ficticios en desarrollo o pruebas:

```powershell
python -m scripts.seed_demo
```

Los scripts solicitan las contraseñas desde la terminal.

## Pruebas

Copia `.env.test.example` como `.env.test` y completa sus valores.
Utiliza una base independiente llamada `kiva_test`, con la estructura
actual de KIVA instalada y sin datos que necesites conservar.

```powershell
$env:KIVA_ENV_FILE = ".env.test"
python -m pytest
Remove-Item Env:KIVA_ENV_FILE
```

Para consultar la cobertura, ejecuta pytest con
`--cov=app --cov-report=term-missing` mientras esté seleccionado
el archivo de configuración de pruebas.

## Docker

Construye la imagen desde `backend`:

```powershell
docker build -t kiva-backend .
```

Para una prueba local con Docker Desktop y PostgreSQL instalado
en Windows:

```powershell
docker run --name kiva-api --env-file .env -e DB_HOST=host.docker.internal -p 127.0.0.1:8000:8000 -v kiva_uploads:/app/uploads kiva-backend
```

El volumen `kiva_uploads` conserva las imágenes entre recreaciones
del contenedor. PostgreSQL debe permitir la conexión desde Docker.

Si PostgreSQL está en otro servicio de Docker Compose, configura
`DB_HOST` con el nombre de ese servicio y utiliza su puerto interno.

En producción, configura `APP_ENV=production`, los orígenes HTTPS
de Angular y los hosts reales del backend. Utiliza una cuenta de
PostgreSQL propia de la aplicación y configura HTTPS en el despliegue.

## Archivos privados

No subas `.env`, `.env.test`, contraseñas, claves JWT, respaldos
ni imágenes cargadas por usuarios. Los archivos `.env.example`
y `.env.test.example` deben conservar sus secretos vacíos.

Las imágenes se almacenan en `uploads/profiles` y
`uploads/destinations`. Sus archivos `.gitkeep` sí se incluyen
en el repositorio.