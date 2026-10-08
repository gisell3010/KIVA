# Uso de KIVA por rol

## Usuario (`USER`)

El espacio personal permite crear grupos, organizar viajes y participar en su planificación. Las acciones disponibles dependen del rol contextual dentro de cada grupo o viaje.

Desde el viaje se consultan participantes, destinos, itinerario, gastos, votaciones, reservas simuladas y calendario. Los miembros pueden proponer destinos y actividades, registrar gastos conforme a sus permisos y votar por varias opciones de una encuesta abierta.

El perfil permite administrar los datos personales y las sesiones. Las notificaciones reúnen los avisos de la cuenta. Mis reportes permite consultar incidencias y responder a sus conversaciones.

## Soporte (`SUPPORT`)

El panel reúne la cola de reportes y las herramientas de diagnóstico de solo lectura. El agente puede asignarse un caso disponible, responder al solicitante y registrar notas internas.

La resolución requiere una explicación. Cuando un caso necesita intervención administrativa, el agente registra el motivo y lo escala. Soporte no modifica roles globales, estados de cuenta ni recursos privados de los viajes.

## Administración (`ADMIN`)

El panel administrativo presenta métricas generales y consultas de usuarios, grupos y viajes. La gestión de cuentas permite suspender o reactivar usuarios con rol `USER`.

La administración atiende reportes escalados y puede reasignar casos activos. La supervisión global no concede permisos para modificar los viajes privados de otras personas.

## Superadministración (`SUPER_ADMIN`)

La superadministración dispone de las funciones de supervisión y de la gestión de roles y estados de cuenta. La aplicación protege la existencia del último `SUPER_ADMIN` activo.

Sus vistas permiten consultar auditoría, salud del sistema y configuración efectiva. Estos permisos globales tampoco sustituyen los roles contextuales dentro de grupos y viajes.

## Roles dentro de grupos y viajes

El propietario del grupo administra sus miembros y puede transferir la propiedad. En cada viaje, el propietario gestiona sus datos y organizadores; los organizadores coordinan participantes y recursos; los miembros colaboran según los permisos establecidos.

El detalle de las operaciones permitidas se encuentra en [Modelo de permisos](../PERMISSIONS.md).
