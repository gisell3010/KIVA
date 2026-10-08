# Arquitectura de KIVA

## Componentes

| Componente | Responsabilidad |
|---|---|
| Angular | Interfaz, formularios, navegación y consumo de la API. |
| FastAPI | Validación, autenticación, autorización y reglas de negocio. |
| PostgreSQL | Persistencia de usuarios, viajes y recursos relacionados. |

Angular consume la API mediante HTTP bajo el prefijo `/api`. FastAPI valida los datos con Pydantic y accede a PostgreSQL mediante SQLAlchemy. Los guards del frontend controlan la navegación; la autorización efectiva se aplica en el backend.

## Organización del dominio

KIVA organiza la colaboración alrededor de grupos y viajes. Cada grupo tiene miembros y un propietario; cada viaje mantiene sus participantes y roles contextuales.

| Área | Recursos |
|---|---|
| Identidad | Usuarios, perfiles y sesiones. |
| Organización | Grupos, viajes y participantes. |
| Planificación | Destinos, fotografías y actividades del itinerario. |
| Gastos | Gastos, categorías, repartos y balances. |
| Decisiones | Encuestas, opciones y votos. |
| Reservas y calendario | Reservas simuladas y consulta unificada de fechas. |
| Comunicación | Notificaciones personales y reportes con conversación. |
| Gestión de plataforma | Supervisión, diagnóstico, auditoría y salud del sistema. |

La base separa autenticación y sesiones en `auth`, el dominio funcional en `app` y la auditoría en `audit`. El calendario reúne fechas de los recursos del viaje; no requiere duplicarlas en una tabla de eventos.

## Acceso y consistencia

Los roles globales son `USER`, `SUPPORT`, `ADMIN` y `SUPER_ADMIN`. Sus responsabilidades son independientes de los roles contextuales de grupo y viaje. Las reglas se describen en [Permisos](../PERMISSIONS.md).

PostgreSQL aplica claves, unicidad y restricciones de integridad. Los servicios del backend comprueban pertenencia, permisos y reglas de negocio, como los participantes de un reparto de gastos o la selección de opciones de una encuesta.

## Servicios compartidos

Las notificaciones se almacenan en PostgreSQL y se consultan periódicamente desde Angular. La campana y la página de notificaciones comparten el contador de pendientes.

Las imágenes se validan en FastAPI y se almacenan localmente o en Cloudinary. La base conserva referencias a los archivos; las credenciales del almacenamiento permanecen en el backend.

## Despliegue

Render es la configuración principal; Docker Compose y Nginx permiten la ejecución en un servidor propio. La configuración se describe en [Despliegue](../DEPLOYMENT.md) y la instalación del esquema en [Base de datos](../../database/README.md).
