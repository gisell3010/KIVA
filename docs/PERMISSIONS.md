# Modelo de permisos de KIVA

KIVA separa los **roles globales de plataforma** de los **roles contextuales** de grupos y viajes. Un rol global no convierte automáticamente a una persona en propietaria ni administradora de los espacios privados de otros usuarios.

## Roles globales

| Rol | Responsabilidad |
|---|---|
| `USER` | Utilizar KIVA y organizar o participar en viajes. |
| `SUPPORT` | Recibir y atender reportes, consultar información básica necesaria para diagnosticar incidencias y escalar casos que requieran intervención administrativa. |
| `ADMIN` | Operar y supervisar la plataforma. Puede suspender o reactivar cuentas `USER`, pero no alterar los viajes privados por ese hecho. |
| `SUPER_ADMIN` | Gestionar seguridad global, roles de staff, estados de cuenta, auditoría, salud y configuración efectiva. |

Todo usuario, aunque globalmente sea `SUPPORT`, `ADMIN` o `SUPER_ADMIN`, puede gestionar su propia cuenta: perfil, fotografía, correo, contraseña, sesiones y notificaciones.

## Grupo

### `MEMBER`

- Consulta grupo y miembros.
- Puede crear un viaje dentro del grupo; al crearlo pasa a ser `Trip OWNER`.
- Puede abandonar el grupo cuando las dependencias lo permitan.

### `OWNER`

Además de lo anterior:

- Edita el grupo.
- Añade miembros.
- Retira miembros cuando las dependencias lo permitan.
- Transfiere la propiedad.
- Elimina el grupo únicamente cuando ya no contiene viajes.

## Viaje

### `MEMBER`

- Consulta participantes, destinos, itinerario, gastos, votaciones, reservas y calendario.
- Propone destinos y puede editar o retirar una propuesta propia mientras las reglas lo permitan.
- Sube fotografías de destinos y puede retirar las propias.
- Propone actividades.
- Registra gastos cuando aparece como pagador y administra los propios según las reglas de negocio.
- Consulta balances.
- Vota por varias opciones de una encuesta y modifica su selección mientras permanezca abierta; no puede repetir una misma opción.
- Consulta resultados.
- Puede abandonar el viaje si no deja registros dependientes.

No tiene edición general del viaje.

### `ORGANIZER`

Tiene funciones operativas:

- Añade y retira participantes `MEMBER`.
- Administra destinos y selecciona propuestas.
- Edita, aprueba, cancela y elimina actividades.
- Registra o corrige gastos de cualquier participante.
- Crea y administra votaciones.
- Crea y administra reservas.

No puede transferir la propiedad, eliminar el viaje, convertir otro usuario en `ORGANIZER` ni retirar a otro `ORGANIZER`.

### `OWNER`

Tiene todo lo del `ORGANIZER` y además:

- Modifica los datos generales y el estado del viaje.
- Asigna o retira `ORGANIZER`.
- Transfiere la propiedad.
- Elimina el viaje cuando las restricciones de integridad lo permitan.

## Regla administrativa principal

`SUPPORT`, `ADMIN` y `SUPER_ADMIN` pueden disponer de vistas globales de diagnóstico o supervisión, pero **no obtienen permisos contextuales sobre grupos o viajes privados**. Si un `SUPER_ADMIN` es `MEMBER` de un viaje, dentro de ese viaje actúa como `MEMBER`; solo lo administra si su rol contextual es `OWNER` u `ORGANIZER`.

## Privacidad y alcance del acceso

La API comprueba los permisos en cada operación. Las notificaciones y sesiones se restringen a su titular; los recursos de viaje requieren la pertenencia y el rol contextual correspondientes.

El solicitante consulta sus propios reportes y mensajes públicos. Las notas internas se reservan al equipo autorizado. Las solicitudes sin sesión requieren número de reporte y clave privada; conocer el correo no acredita identidad.

En auditoría, el nombre y el rol global del autor se consultan desde su cuenta actual; no representan una copia histórica de esos datos.
