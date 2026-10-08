# Despliegue de KIVA

El despliegue público principal de KIVA se realiza en Render. La configuración Docker Compose + Nginx se conserva como alternativa para un VPS o servidor propio.

## Arquitectura pública en Render

```text
Usuario
   |
   | HTTPS
   v
Render Static Site
Angular
   |
   | /api/*
   v
Render Rewrite
   |
   v
Render Web Service
Docker + Uvicorn + FastAPI
   |
   v
Render Postgres
```

Las fotografías se validan y procesan en FastAPI y se almacenan en Cloudinary. PostgreSQL conserva una referencia interna a cada archivo; las imágenes no dependen del disco local del Web Service. Los límites de uso dependen de los planes de cada proveedor.

## Archivos

```text
deploy/
├── .env.production.example        # Solo Docker/VPS alternativo
├── README.md
├── render/
│   ├── README.md                  # Procedimiento principal en Render
│   └── backend.env.example        # Referencia de variables del backend
├── docker/
│   └── docker-compose.prod.yml    # Alternativa Docker/VPS
└── nginx/
    ├── nginx.prod.conf            # Reverse proxy alternativo
    └── ssl/
        └── .gitkeep
```

El frontend de la alternativa Docker utiliza además:

```text
frontend/Dockerfile.prod
frontend/nginx.conf
```

## Render

Consulta [Despliegue en Render](render/README.md).

La configuración principal es:

```text
Frontend:  Render Static Site
Backend:   Render Web Service con Docker y Uvicorn
Base:      Render Postgres
Imágenes:  Cloudinary Free
HTTPS:     administrado por Render
```

El frontend mantiene `apiUrl: '/api'`. En el Static Site se configura primero un rewrite de `/api/*` hacia la URL pública del backend y después el fallback `/* -> /index.html` para Angular Router.

## Alternativa Docker Compose + Nginx

Esta alternativa no representa el despliegue público final, pero se conserva para ejecutar KIVA en infraestructura propia.

Requisitos:

- Docker con Docker Compose v2.
- Un dominio configurado para el servidor.
- Certificado TLS y clave privada válidos.
- Valores seguros para `POSTGRES_PASSWORD` y `JWT_SECRET`.

Crea el archivo privado:

```powershell
Copy-Item deploy/.env.production.example deploy/.env.production
```

Completa:

```env
POSTGRES_DB=kivadb
POSTGRES_USER=kiva_user
POSTGRES_PASSWORD=TU_PASSWORD_SEGURA
JWT_SECRET=TU_SECRETO_DE_AL_MENOS_32_CARACTERES
CORS_ORIGINS=["https://tu-dominio.com","https://www.tu-dominio.com"]
ALLOWED_HOSTS=["tu-dominio.com","www.tu-dominio.com"]
```

Los certificados se ubican en:

```text
deploy/nginx/ssl/fullchain.pem
deploy/nginx/ssl/privkey.pem
```

La composición alternativa instala la estructura automáticamente al inicializar un volumen PostgreSQL vacío. Un volumen existente no vuelve a ejecutar los scripts de instalación.

Desde `deploy/docker/`:

```powershell
docker compose --env-file ../.env.production -f docker-compose.prod.yml up -d postgres
```

Cuando PostgreSQL esté disponible, levanta el resto de servicios desde el mismo directorio:

```powershell
docker compose --env-file ../.env.production -f docker-compose.prod.yml up -d --build
```

Para actualizar una base existente, realizar primero un respaldo y ejecutar desde `deploy/docker/`:

```powershell
docker compose --env-file ../.env.production -f docker-compose.prod.yml exec backend alembic upgrade head
```

El primer `SUPER_ADMIN` puede crearse con `docker compose --env-file ../.env.production -f docker-compose.prod.yml exec backend python -m scripts.create_superadmin`.

En esta arquitectura Nginx exterior termina HTTPS, envía `/api/` a FastAPI y el resto al contenedor que sirve el build de Angular.

## Separación de responsabilidades

```text
Render
→ despliegue público principal

Docker Compose + Nginx
→ alternativa de servidor propio / VPS

Docker Compose raíz
→ desarrollo local
```
