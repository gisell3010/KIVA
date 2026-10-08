# API de KIVA

FastAPI publica los recursos bajo `/api`; Swagger está en `/api/docs`. Los endpoints protegidos validan la sesión y el estado actual de la cuenta, además de los permisos de la operación. Las respuestas de error tienen `error.code` y `error.message`. La paginación usa `page` y `page_size` (máximo 100).

## Recursos principales

Todos los prefijos siguientes parten de `/api`:

| Recurso | Prefijo |
|---|---|
| Autenticación y sesiones | `/auth` |
| Usuarios y perfil | `/users` |
| Grupos | `/groups` |
| Viajes y participantes | `/trips` |
| Destinos | `/trips/{trip_id}/destinations` |
| Actividades | `/trips/{trip_id}/activities` |
| Gastos | `/trips/{trip_id}/expenses` |
| Votaciones | `/trips/{trip_id}/polls` |
| Reservas simuladas | `/trips/{trip_id}/reservations` |
| Catálogos | `/catalogs` |
| Calendario | `/calendar` |
| Resumen de usuario | `/dashboard` |
| Administración | `/admin` |
| Superadministración | `/super-admin` |
| Salud | `/health` |

Swagger UI describe los métodos, parámetros y esquemas de cada operación. Las respuestas paginadas contienen `items`, `total`, `page` y `page_size`.

## Comunicación

| Recurso | Prefijo | Alcance |
|---|---|---|
| Notificaciones | `/notifications` | Consulta, contador y gestión de avisos del destinatario. |
| Reportes personales y públicos | `/support-reports` | Registro y seguimiento de incidencias según la identidad o clave de acceso. |
| Atención y diagnóstico | `/support` | Consulta y atención por el equipo autorizado. |

Las notas internas no se incluyen en las respuestas personales o públicas. La documentación interactiva especifica los parámetros y requisitos de cada endpoint.

## Autorización

Los endpoints validan la sesión, el estado de la cuenta y los permisos de la operación. Los recursos privados de grupos y viajes requieren los roles contextuales correspondientes; un rol administrativo global no concede acceso de edición por sí mismo.

La definición de roles y restricciones se encuentra en [Modelo de permisos](../PERMISSIONS.md).
