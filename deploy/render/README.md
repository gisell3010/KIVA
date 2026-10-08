# Despliegue de KIVA en Render y Cloudinary

La arquitectura de referencia utiliza Angular como Render Static Site, FastAPI como Render Web Service Docker, Render Postgres y Cloudinary para imágenes. El navegador consume `/api` en el dominio del frontend mediante una regla Rewrite; esto mantiene la cookie de sesión en el mismo origen. Nginx se reserva para la alternativa Docker/VPS.

## Requisitos

- Repositorio GitHub con `backend/`, `frontend/` y `database/` en su raíz.
- Cuentas en Render y Cloudinary.
- Python y las dependencias de `backend/requirements.txt` disponibles en el equipo de administración.
- Cliente `psql` de PostgreSQL 16 para inicializar la base desde el equipo local.
- PowerShell para los comandos de esta guía.

Los valores entre `<...>` son marcadores y deben sustituirse. Los nombres de servicios son ejemplos; se deben utilizar las URL exactas asignadas por Render. No se publican `.env`, entornos virtuales, imágenes locales ni copias de la base en Git.

## 1. Preparar el repositorio

Desde la raíz de KIVA:

```powershell
git status --short
git branch --show-current
cd frontend
npm ci
npm run build
cd ..
```

La compilación genera `frontend/dist/kiva/browser`. Los archivos de esa carpeta no se suben al repositorio: Render los genera durante el despliegue. Los cambios revisados deben estar confirmados y enviados a la misma rama que se seleccionará en Render.

## 2. Configurar Cloudinary

1. Crear una cuenta Free en [Cloudinary](https://cloudinary.com/).
2. Abrir la consola del producto de imágenes y consultar el **Cloud name**.
3. Abrir **Settings → API Keys** y obtener **API key** y **API secret** del mismo entorno.
4. Conservar esas credenciales para las variables del backend del paso 7.

No se necesita un upload preset sin firma: el backend utiliza el SDK con sus credenciales. FastAPI valida las imágenes y las normaliza antes de subirlas. PostgreSQL almacena referencias `cloudinary:kiva/...`.

La subida actual utiliza el tipo de entrega estándar `upload` de Cloudinary. Los endpoints de KIVA exigen autorización para consultar las imágenes, pero una URL directa de Cloudinary que se comparta puede abrirse sin iniciar sesión en KIVA; no es un almacén de entrega privada.

## 3. Crear PostgreSQL en Render

1. En [Render Dashboard](https://dashboard.render.com/), elegir **New → Postgres**.
2. Indicar un nombre, por ejemplo `kiva-db`.
3. Usar `kivadb` como Database y `kiva_user` como User, si el formulario permite definirlos.
4. Seleccionar PostgreSQL **16** y el plan **Free**.
5. Elegir una región y usar la misma para el backend.
6. Crear la base y esperar a que aparezca **Available**.
7. Consultar los valores reales de Database, Username, Password, Port, Internal Hostname y External Hostname en las conexiones del servicio.

La conexión desde el equipo local usa el **hostname externo completo**. El backend de Render usa el **hostname interno**. `DB_HOST` contiene solo el hostname, no `postgresql://`, usuario, contraseña ni ruta. El nombre de la base y el usuario deben copiarse de Render aunque difieran de los ejemplos.

## 4. Instalar una base nueva

Este procedimiento crea una instalación vacía con catálogos; no copia usuarios, viajes ni fotos locales. Si se van a conservar los datos locales, utilizar la sección «Trasladar datos existentes» en lugar de ejecutar `install.sql` sobre el destino.

Abrir una terminal PowerShell desde la raíz de KIVA:

```powershell
psql --version
$env:PGSSLMODE = 'require'
psql -h '<HOST_EXTERNO>' -p 5432 -U '<USUARIO_RENDER>' -d '<BASE_RENDER>' -W -v ON_ERROR_STOP=1 -f database/install.sql
```

Introducir la contraseña de PostgreSQL proporcionada por Render. Si `psql` no está en PATH, se puede ejecutar mediante su ruta instalada:

```powershell
& 'C:\Program Files\PostgreSQL\16\bin\psql.exe' -h '<HOST_EXTERNO>' -p 5432 -U '<USUARIO_RENDER>' -d '<BASE_RENDER>' -W -v ON_ERROR_STOP=1 -f database/install.sql
```

La operación termina con `KIVA: estructura, índices y catálogos instalados.` Si falla, detener la secuencia y revisar el primer error. Cada script administra su propia transacción; no se debe volver a instalar a ciegas sobre tablas ya creadas.

No se ejecutan `CREATE ROLE`, `CREATE DATABASE` ni la instalación de `kivadb_test` en Render: el servicio ya proporciona la base y su usuario.

## 5. Registrar las migraciones y crear el superadministrador

Render Free no incluye una terminal Shell. Estas tareas se ejecutan desde el equipo local, conectado a la base remota.

Desde la raíz del repositorio, en la misma terminal:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env.render
```

Crear `.env.render` solo si todavía no existe. Ese archivo está excluido por `.gitignore`. Configurar:

```env
APP_ENV=development
DB_HOST=<HOST_EXTERNO>
DB_PORT=5432
DB_NAME=<BASE_RENDER>
DB_USER=<USUARIO_RENDER>
DB_PASSWORD=<PASSWORD_RENDER>
JWT_SECRET=<SECRETO_PROPIO_DE_AL_MENOS_32_CARACTERES>
IMAGE_STORAGE=local
```

Este archivo se utiliza únicamente para los comandos administrativos; no inicia una API pública. El servicio alojado utilizará `APP_ENV=production` e imágenes en Cloudinary.

Generar el secreto de producción con:

```powershell
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Guardar ese valor en `.env.render` y en las variables del backend de Render. No es necesario modificar el secreto del `.env` local.

```powershell
$env:KIVA_ENV_FILE = '.env.render'
$env:PGSSLMODE = 'require'
python -m alembic upgrade head
python -m alembic current
python -m scripts.create_superadmin
```

El estado esperado de Alembic es `20261007_support (head)`. El script solicita nombre, usuario, correo y contraseña. La contraseña no se muestra al escribir. El superadministrador local no existe automáticamente en una base remota nueva; si se restauró una base que ya lo contiene, no se repite su creación.

Antes de volver al desarrollo local:

```powershell
Remove-Item Env:KIVA_ENV_FILE -ErrorAction SilentlyContinue
Remove-Item Env:PGSSLMODE -ErrorAction SilentlyContinue
cd ..
```

## 6. Crear el frontend

En Render elegir **New → Static Site**, conectar GitHub y seleccionar el repositorio y la rama que contiene los cambios publicados.

| Campo | Valor |
|---|---|
| Name | Nombre único, por ejemplo `kiva-web-<identificador>` |
| Root Directory | `frontend` |
| Build Command | `npm ci && npm run build` |
| Publish Directory | `dist/kiva/browser` |
| Variable `NODE_VERSION` | `24.19.0` |

Crear el sitio y copiar su URL HTTPS exacta. En esta etapa los archivos de Angular pueden estar publicados, pero las funciones que requieren la API no estarán disponibles hasta completar los siguientes pasos.

## 7. Crear el backend

Elegir **New → Web Service**, conectar el mismo repositorio y seleccionar la misma rama.

| Campo | Valor |
|---|---|
| Name | Nombre único, por ejemplo `kiva-api-<identificador>` |
| Language / Runtime | `Docker` |
| Region | La misma de PostgreSQL |
| Root Directory | `backend` |
| Dockerfile Path | `./Dockerfile` |
| Docker Build Context Directory | `.` |
| Docker Command | Vacío; utiliza el CMD del Dockerfile |
| Instance Type | `Free` |
| Health Check Path | `/api/health/ready` |

Las rutas Docker anteriores son relativas a Root Directory. No se debe indicar `backend/Dockerfile` cuando Root Directory ya es `backend`.

Agregar estas variables en **Environment**:

| Variable | Valor |
|---|---|
| `APP_ENV` | `production` |
| `DB_HOST` | Hostname interno de PostgreSQL |
| `DB_PORT` | `5432` o puerto indicado por Render |
| `DB_NAME` | Nombre real de la base |
| `DB_USER` | Usuario real de PostgreSQL |
| `DB_PASSWORD` | Contraseña de PostgreSQL de Render |
| `PGSSLMODE` | `require` |
| `JWT_SECRET` | Secreto generado en el paso 5 |
| `CORS_ORIGINS` | `["https://<FRONTEND_REAL>.onrender.com"]` |
| `ALLOWED_HOSTS` | `["<BACKEND_REAL>.onrender.com","<FRONTEND_REAL>.onrender.com"]` |
| `IMAGE_STORAGE` | `cloudinary` |
| `CLOUDINARY_CLOUD_NAME` | Cloud name |
| `CLOUDINARY_API_KEY` | API key |
| `CLOUDINARY_API_SECRET` | API secret |
| `ACCESS_TOKEN_MINUTES` | `15` |
| `REFRESH_TOKEN_DAYS` | `7` |
| `LOG_LEVEL` | `INFO` |
| `MAX_IMAGE_BYTES` | `5242880` |
| `MAX_DESTINATION_PHOTOS` | `10` |

Las listas usan formato JSON. Los orígenes incluyen `https://` y no terminan en `/`; los hosts no incluyen protocolo ni ruta. No se utilizan `localhost`, comodines CORS ni las credenciales de PostgreSQL local.

Crear el servicio y comprobar la URL asignada. Si Render le añade un sufijo, actualizar `ALLOWED_HOSTS` con ese hostname exacto y guardar los cambios. Render establece `PORT`; el Dockerfile ya lo utiliza. No se necesita agregarlo manualmente ni cambiar el comando de inicio.

Cuando el servicio esté **Live**, abrir:

```text
https://<BACKEND_REAL>.onrender.com/api/health
https://<BACKEND_REAL>.onrender.com/api/health/ready
```

La segunda ruta debe responder `{"status":"ok","database":"ok"}`. Swagger se publica en `/api/docs`.

## 8. Conectar el frontend con la API

En el Static Site abrir **Redirects/Rewrites** y guardar estas reglas, en este orden:

| Source | Destination | Action |
|---|---|---|
| `/api/*` | `https://<BACKEND_REAL>.onrender.com/api/*` | `Rewrite` |
| `/*` | `/index.html` | `Rewrite` |

Ambas acciones son **Rewrite**, no Redirect. La regla de API debe preceder al fallback de Angular. `environment.ts` mantiene `apiUrl: '/api'`; no se sustituye por localhost ni por una URL de Cloudinary.

Abrir `https://<FRONTEND_REAL>.onrender.com/api/health/ready`: debe devolver el mismo JSON que el backend, no una página HTML. Después comprobar el inicio de sesión y la recarga de una ruta privada. Esa comprobación valida también el reenvío de POST y de la cookie de sesión; una respuesta GET por sí sola no verifica la autenticación completa.

## 9. Comprobar la aplicación publicada

1. Iniciar sesión con el superadministrador creado en la base remota.
2. Abrir Configuración, editar el campo de correo sin enviarlo, cambiar el tema y navegar al perfil. Recargar Configuración y comprobar que la sesión continúa.
3. Registrar una cuenta USER, crear un grupo y un viaje; comprobar miembros y roles contextuales.
4. Crear un destino y subir una fotografía; subir también la foto de perfil. Verificar los recursos en Cloudinary.
5. Comprobar itinerario, gastos y balances, votaciones, reservas simuladas y calendario.
6. Comprobar notificaciones, reportes personales y seguimiento desde Ayuda.
7. Con cuentas de verificación, comprobar USER, SUPPORT, ADMIN y SUPER_ADMIN: acceso permitido y rechazo de operaciones fuera de sus roles. Superadministración permite asignar los roles de plataforma.
8. Reiniciar el backend desde Render y comprobar que los datos y las imágenes permanecen disponibles.

Las pruebas automatizadas que crean datos se ejecutan en una base aislada, no en la base publicada.

## Trasladar datos existentes

Esta alternativa reemplaza únicamente la instalación vacía del paso 4. Se utiliza si es necesario conservar los usuarios y viajes locales. El destino debe estar vacío; no se combina una restauración completa con `install.sql`.

Detener las modificaciones en la aplicación local y realizar el respaldo desde la raíz del repositorio:

```powershell
New-Item -ItemType Directory -Force backups | Out-Null
pg_dump -h localhost -p 5432 -U kiva_user -d kivadb -W -Fc --no-owner --no-acl -f backups/kivadb.dump
$env:PGSSLMODE = 'require'
pg_restore -h '<HOST_EXTERNO>' -p 5432 -U '<USUARIO_RENDER>' -d '<BASE_RENDER>' -W --no-owner --no-acl --exit-on-error backups/kivadb.dump
```

Usar los valores reales de la conexión local si difieren del ejemplo. El cliente `pg_dump` debe ser compatible con la versión de origen. No se necesitan `--clean` ni operaciones de borrado en el destino vacío. Continuar con Alembic en el paso 5; conservar el superadministrador restaurado si ya existe.

El respaldo de PostgreSQL no contiene los archivos de `backend/uploads/`. Conservar esa carpeta fuera de Git. Cambiar `IMAGE_STORAGE` no migra imágenes: después del despliegue, volver a cargar las fotos de perfil y retirar/reemplazar las fotos de destinos desde las cuentas autorizadas, usando los archivos conservados. Las referencias locales restauradas mostrarán una imagen no disponible hasta completar ese proceso. No debe considerarse terminada una migración con fotos pendientes.

## Actualizaciones y mantenimiento

Para actualizaciones posteriores, realizar un respaldo externo y ejecutar las nuevas migraciones contra la base remota antes de publicar código que dependa de ellas. No volver a ejecutar `install.sql` ni crear el superadministrador en cada despliegue.

El backend Free puede entrar en reposo después de 15 minutos sin solicitudes; el arranque posterior puede tardar aproximadamente un minuto. La autenticación de KIVA tiene un tiempo de espera de 15 segundos: antes de una demostración, abrir `/api/health/ready`, esperar respuesta y después abrir el frontend.

Render Postgres Free caduca a los 30 días. La conservación de la base requiere gestionar el plan o exportar los datos antes del vencimiento; Free no ofrece respaldos administrados. Cloudinary y Render tienen límites de uso que deben consultarse en sus paneles. Estos servicios gratuitos permiten una demostración académica, pero no garantizan disponibilidad continua.

## Diagnóstico

| Síntoma | Comprobación |
|---|---|
| `Invalid host header` | Hostnames exactos en `ALLOWED_HOSTS`, incluido el frontend del Rewrite. |
| Backend no inicia | Logs del servicio, variables obligatorias y JSON de las listas. |
| `/api/health/ready` devuelve 503 | Conexión interna, región, credenciales y esquema instalado. |
| La API del frontend devuelve HTML | Destino y orden de los Rewrite. |
| Error de origen o 403 al iniciar sesión | `CORS_ORIGINS` exacto y regla de API sin Redirect. |
| Se pierde la sesión al recargar | Cookie Secure/HttpOnly, acceso HTTPS y reenvío de la cookie por `/api`. |
| Error al subir imágenes | Tres credenciales del mismo entorno Cloudinary, límites de cuenta y formato/tamaño del archivo. |
| Fotos locales ausentes | Los archivos locales no se copian con PostgreSQL ni al cambiar de proveedor. |
| Primera petición lenta | Arranque del servicio Free después del reposo. |
| `psql` no se reconoce | PATH de PostgreSQL o ruta completa al ejecutable. |

## Referencias

- [Render: planes gratuitos](https://render.com/docs/free).
- [Render: PostgreSQL y conexiones](https://render.com/docs/postgresql-creating-connecting).
- [Render: Docker](https://render.com/docs/docker).
- [Render: monorepos](https://render.com/docs/monorepo-support).
- [Render: versión de Node.js](https://render.com/docs/node-version).
- [Render: Redirects y Rewrites](https://render.com/docs/redirects-rewrites).
- [Cloudinary: credenciales](https://cloudinary.com/documentation/developer_onboarding_faq_find_credentials).
