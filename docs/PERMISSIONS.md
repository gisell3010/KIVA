# Modelo de permisos de KIVA

KIVA separa los **roles globales de plataforma** de los **roles contextuales** de grupos y viajes. Un rol global no convierte automáticamente a una persona en propietaria ni administradora de los espacios privados de otros usuarios.

## Roles globales

| Rol | Responsabilidad |
|---|---|
| `USER` | Utilizar KIVA y organizar o participar en viajes. |
| `SUPPORT` | Diagnosticar incidencias principalmente en modo lectura. Puede revocar sesiones de una cuenta `USER` por un problema de acceso o seguridad, dejando auditoría. |
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


## Herramientas de diagnóstico implementadas

En `/soporte/usuarios`, el detalle de una cuenta permite abrir sus grupos y viajes relacionados. La vista `/soporte/diagnostico` consulta participantes, destinos, actividades, gastos, repartos, votaciones, resultados y reservas. Los pagadores y participantes se presentan con su nombre. Estos endpoints usan `SupportUser` y comprobaciones de rol global independientes; no conceden membresía en los endpoints privados.

La acción `POST /api/support/users/{user_id}/revoke-sessions` acepta únicamente cuentas `USER`, invalida sus sesiones y registra `SUPPORT_SESSIONS_REVOKE` en auditoría. No cambia el estado, el rol ni la pertenencia a grupos o viajes. ADMIN y SUPER_ADMIN acceden también a estas herramientas.

En auditoría se consulta el nombre y el rol global actual del autor mediante una relación con `auth.users`; no se almacena una copia histórica del nombre o del rol. El identificador original permanece en el registro.
