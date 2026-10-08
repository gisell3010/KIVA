# Despliegue de KIVA

La configuración de referencia utiliza los servicios siguientes; la disponibilidad y permanencia dependen del plan:

```text
Usuario
  -> Render Static Site (Angular)
  -> /api rewrite
  -> Render Web Service (Docker + Uvicorn + FastAPI)
       -> Render Postgres
       -> Cloudinary (imágenes)
```

## Imágenes

En desarrollo local, `IMAGE_STORAGE=local` conserva las imágenes bajo `backend/uploads` y Docker puede persistir esa carpeta con un volumen.

En Render Free, `IMAGE_STORAGE=cloudinary` evita depender del filesystem efímero del Web Service. El recorrido es:

1. Angular envía la imagen a FastAPI con `multipart/form-data`.
2. `python-multipart` recibe el archivo.
3. Pillow valida formato, tamaño, dimensiones y normaliza la imagen a JPEG.
4. El backend usa el SDK de Cloudinary para almacenarla.
5. PostgreSQL guarda una referencia interna `cloudinary:kiva/...`, no el binario ni las credenciales.
6. Los endpoints protegidos de KIVA siguen controlando el acceso a las imágenes, por lo que Angular no necesita conocer el API secret de Cloudinary.

Variables necesarias en Render:

```env
IMAGE_STORAGE=cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

Las credenciales de Cloudinary pertenecen exclusivamente al backend y no deben incluirse en Angular ni en Git.

## Nginx

En la alternativa Docker/VPS, Nginx sirve el build estático de Angular; un proxy Nginx exterior termina HTTPS y dirige las peticiones a la API o al frontend. No participa en la configuración de Render con Static Site.


## Actualización y verificación

La guía operativa está en [Despliegue en Render](../deploy/render/README.md). Una base vacía se inicializa con `database/install.sql`. Una base KIVA existente se actualiza, previo respaldo, con `python -m alembic upgrade head` desde `backend/`. La revisión Alembic no sustituye la instalación inicial del dominio.

Angular 22.2.1 utiliza Node.js 24.15 o posterior de la rama 24 en la configuración recomendada del proyecto.

Los límites y la caducidad de los recursos gratuitos se consultan en las [condiciones de Render](https://render.com/docs/free). Los respaldos deben conservarse fuera del servicio. Cambiar `IMAGE_STORAGE` no transfiere automáticamente las fotografías locales a Cloudinary.

## Comprobación del servicio

La comprobación comprende salud de la API y de la base, autenticación, renovación de sesión, configuración de cuenta, imágenes, grupos, viajes, recursos de planificación, gastos, votaciones, reservas, calendario, notificaciones y permisos de los cuatro roles globales. El procedimiento y los resultados esperados se describen en la guía de Render.
