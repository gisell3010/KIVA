# Modelo de datos

[kivadb.dbml](../../database/schema/kivadb.dbml) describe las 21 tablas de dominio actuales. Los scripts en `database/scripts/` definen el esquema; las migraciones de `backend/alembic/versions/` actualizan las instalaciones existentes. La instalación y las migraciones se detallan en [Base de datos](../../database/README.md).

- [KIVA.pdf](KIVA.pdf) y [KIVA.png](KIVA.png): diagrama completo, para consultar con zoom.
- [KIVA.svg](KIVA.svg): versión vectorial.
- [KIVA.dot](KIVA.dot): fuente Graphviz del diagrama.

El diagrama incluye relaciones, claves y tipos del modelo ORM. La precisión de los tipos PostgreSQL y restricciones se consulta en SQL/DBML. `auth.alembic_version` es una tabla técnica de migraciones y no forma parte de las 21 tablas de dominio.

En el diagrama, `PK` identifica la clave primaria, `FK` una clave foránea y `?` un atributo que admite valores nulos. `DATETIME` es la representación genérica del ORM; los eventos del sistema se almacenan como `TIMESTAMPTZ` en PostgreSQL. Las fechas funcionales utilizan `DATE` y la hora local de las actividades utiliza `TIME`.

Los cambios del modelo deben reflejarse en el DBML y en todos los formatos del diagrama.
