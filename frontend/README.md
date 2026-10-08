# Frontend de KIVA

Interfaz web de KIVA desarrollada con Angular 22.2.1, componentes standalone, Signals y RxJS. Consume la API FastAPI bajo el prefijo `/api`.

## Requisitos

- Node.js 24.15 o posterior de la rama 24, utilizada por los contenedores del proyecto. `package.json` declara las ramas compatibles.
- npm.
- Backend disponible en `http://localhost:8000` para desarrollo local.

## Instalación y ejecución

Desde la raíz del repositorio:

```powershell
cd frontend
npm ci
npm start
```

La aplicación se sirve en `http://localhost:4200`. `proxy.conf.json` redirige las peticiones `/api` al backend local.

## Compilación

```powershell
npm run build
```

Los archivos estáticos se generan en `dist/kiva/browser`. La configuración de despliegue se describe en [Render](../deploy/render/README.md) y [Docker Compose + Nginx](../deploy/README.md).

## Organización

| Directorio | Responsabilidad |
|---|---|
| `src/app/pages/` | Páginas de la aplicación. |
| `src/app/core/` | Autenticación, guards, HTTP y tema visual. |
| `src/app/data-access/` | Servicios de acceso a la API. |
| `src/app/features/` | Funcionalidades organizadas por área. |
| `src/app/shared/` | Componentes, modelos y utilidades compartidos. |
| `src/environments/` | Configuración pública de la aplicación. |
| `e2e/` | Pruebas de extremo a extremo con Playwright. |

Los guards controlan la navegación, pero la autorización efectiva se aplica en el backend. Las variables incluidas en Angular son públicas y no deben contener contraseñas, secretos JWT ni credenciales de servicios externos.

## Pruebas E2E

Desde `frontend/`:

```powershell
npx playwright install
$env:E2E_SUPERADMIN_EMAIL = "superadmin@example.com"
$env:E2E_SUPERADMIN_PASSWORD = "<contraseña de la cuenta de pruebas>"
npm run e2e
```

La cuenta debe existir previamente en una base aislada de pruebas. Los valores anteriores son marcadores de configuración, no credenciales predeterminadas. El backend debe estar iniciado; Playwright inicia el frontend o reutiliza el servidor local existente según `playwright.config.ts`.

Las pruebas crean y modifican datos: no deben ejecutarse contra una base de producción. La interfaz de Playwright se abre con `npm run e2e:ui`.

## Documentación relacionada

- [Descripción del proyecto](../README.md).
- [Backend](../backend/README.md).
- [Manuales de uso](../docs/manuals/README.md).
