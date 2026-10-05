# Despliegue académico de KIVA

El despliegue público elegido para KIVA evita servicios de pago:

```text
Usuario
  -> Render Static Site (Angular)
  -> /api rewrite
  -> Render Web Service Free (Docker + Uvicorn + FastAPI)
       -> Render Postgres Free
       -> Cloudinary Free (imágenes)
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

Nginx se conserva como alternativa de despliegue Docker/VPS y para demostrar cómo se sirve un build estático de Angular y cómo funciona un reverse proxy. No participa en la ruta pública final de Render.
