# Despliegue de KIVA en Render + Cloudinary

El despliegue de KIVA usa los siguientes recursos:

```text
Angular Static Site (Render)
        |
       /api
        v
FastAPI Web Service Free (Render)
        |
        +--> Render Postgres Free
        |
        +--> Cloudinary Free (imágenes)
```

## 1. PostgreSQL

Crea Render Postgres Free cerca de la fecha de sustentación. La base se llama `kivadb` y se inicializa con `database/install.sql`.

```powershell
psql "<EXTERNAL_DATABASE_URL>" -v ON_ERROR_STOP=1 -f database/install.sql
```

## 2. Backend

Crea un Web Service conectado al repositorio:

```text
Runtime:        Docker
Dockerfile:     backend/Dockerfile
Docker context: backend
Health check:   /api/health/ready
```

Configura las variables del archivo `backend.env.example`. Para producción gratuita usa:

```env
IMAGE_STORAGE=cloudinary
```

Las credenciales de Cloudinary solo existen en Render/backend. Nunca se envían a Angular ni se guardan en Git.

## 3. Cloudinary

Crea una cuenta Free y copia desde Cloudinary Console:

```text
Cloud name
API key
API secret
```

FastAPI sigue recibiendo el archivo, Pillow lo valida y normaliza a JPEG, y luego el backend lo sube a Cloudinary. PostgreSQL conserva una referencia interna (`cloudinary:kiva/...`) para poder eliminar o recuperar el archivo.

Esto reemplaza la necesidad de Persistent Disk en Render Free. En desarrollo local `IMAGE_STORAGE=local` mantiene el comportamiento actual con `backend/uploads`.

## 4. Frontend

Crea un Static Site:

```text
Root Directory:    frontend
Build Command:     npm ci && npm run build
Publish Directory: dist/kiva/browser
```

Configura primero el rewrite de API:

```text
/api/* -> https://<backend>.onrender.com/api/*
```

Y después el fallback SPA:

```text
/* -> /index.html
```

## 5. Qué ocurre con Nginx

Nginx se conserva como alternativa para un despliegue Docker/VPS y para probar el build Angular de producción. No forma parte del despliegue público final en Render.

## 6. Verificación antes de sustentar

Comprueba:

- `/api/health` y `/api/health/ready`;
- registro, login y refresh;
- foto de perfil;
- fotos de destinos;
- grupos y viajes;
- permisos OWNER/ORGANIZER/MEMBER;
- gastos, votaciones, reservas y calendario.
