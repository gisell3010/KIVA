# KIVA — Frontend (Angular 18)

**Kinship, Inspiration, Voyages & Adventures**

Plataforma colaborativa para grupos de amigos que planifican y organizan viajes juntos.

## Módulos incluidos

### Espacio de Usuario
- **Dashboard** — Resumen general con KPIs, grupos recientes y eventos próximos
- **Grupos** — Gestión de grupos de viaje (crear, ver miembros, viajes)
- **Viajes** — Planificación de viajes dentro de grupos (separado de grupos)
- **Participantes** — Directorio de usuarios con sus membresías
- **Destinos** — Propuestas y votación de destinos por viaje
- **Itinerario** — Plan día a día con actividades tipificadas
- **Gastos** — Registro y división de gastos con balance por persona
- **Votaciones** — Encuestas grupales para decisiones democráticas
- **Reservas** — Simulación de vuelos, hoteles y actividades
- **Calendario** — Vista mensual unificada de eventos
- **Notificaciones** — Centro de notificaciones con tipos categorizados
- **Perfil** — Información personal editable y preferencias de viaje
- **Configuración** — Tema (claro/oscuro/sistema), notificaciones, accesibilidad

### Área de Administración
- **Panel de Administración** — Métricas agregadas de la plataforma
- **Gestión de Usuarios** — Búsqueda, filtrado, roles y estado
- **Visión General** — Salud de la plataforma, actividad por tipo, top grupos

## Arquitectura

### Modelo de Roles (Separación Estricta)
- **Rol Global de Plataforma**: `ADMIN` | `USER`
- **Rol de Grupo**: `OWNER` | `MEMBER`
- **Rol de Viaje**: `OWNER` | `ORGANIZER` | `MEMBER`

Un usuario puede ser `ADMIN` globalmente y `MEMBER` en un viaje privado.

### Separación Grupo vs Viaje
- **Grupo**: Colección persistente de amigos (ej. "Amigos de la Universidad")
- **Viaje**: Instancia específica con fechas, destino, presupuesto (ej. "Patagonia 2026")
- Un grupo puede tener múltiples viajes

### Preparado para FastAPI/PostgreSQL
- Capa de acceso a datos con patrón Repository
- Interfaces tipadas para reemplazo futuro por HttpClient
- Models compatibles con UUIDs, enums estables, fechas ISO
- Autenticación JWT-ready con AuthService, AuthGuard, RoleGuard

## Tecnologías
- **Angular 18** (Standalone Components, Signals, Control Flow)
- **TypeScript** strict mode
- **CSS Design Tokens** para Light/Dark/System themes
- **RxJS** para estado reactivo
- **Sin librerías UI pesadas** — componentes SVG propios

## Requisitos
- Node.js 18+ y npm
- Angular CLI (`npm install -g @angular/cli`)

## Instalación y ejecución

```bash
npm install
npm start
```

Luego abre http://localhost:4200

## Build de producción

```bash
npm run build
```

Los archivos generados quedarán en `dist/kiva`.

## Estructura del proyecto

```
src/app/
  core/
    auth/           → AuthService, AuthGuard, RoleGuard
    guards/         → Guards de autenticación/autorización
    theme/          → ThemeService (light/dark/system)
    layout/         → Componentes de layout compartidos
  shared/
    components/     → NotificationDropdown, ProfileDropdown, Search
    models/         → Domain models (domain.models.ts)
    utils/          → Utilidades compartidas
  features/
    auth/login/     → Login con selector de usuario demo
    settings/       → Configuración completa
    profile/        → Perfil editable
    notifications/  → NotificationService + página
    admin/          → Dashboard, Users, Overview
    trips/          → Gestión de viajes
  pages/            → Páginas legacy (dashboard, grupos, etc.)
  data-access/
    mock/           → MockDataService (datos simulados)
    api/            → Preparado para HttpClient
    repositories/   → Interfaces Repository para FastAPI
```

## Cuentas demo

El login incluye un selector de usuario demo:
- **Admin User** (ADMIN) — Acceso a panel admin + espacio usuario
- **Camila Rojas** (USER) — Usuario regular
- **Julián Pérez** (USER) — Usuario regular
- etc.

Contraseña para todos: `demo123`

## Próximos pasos (Backend)

1. Implementar FastAPI con endpoints REST según interfaces en `data-access/repositories/`
2. PostgreSQL con esquemas: `auth`, `app`, `audit`
3. Autenticación JWT (access/refresh tokens)
4. Reemplazar `MockDataService` por servicios HTTP reales
5. Configurar `environment.apiBaseUrl` (ej. `http://localhost:8000/api/`)