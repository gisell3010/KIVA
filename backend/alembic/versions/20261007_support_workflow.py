"""Flujo de soporte y destino de notificaciones en bases ya instaladas."""
from pathlib import Path
from alembic import op

revision = "20261007_support"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    sql = Path(__file__).with_name("support_workflow.sql").read_text(encoding="utf-8")
    op.get_bind().exec_driver_sql(sql)


def downgrade():
    raise RuntimeError("Esta migración conserva conversaciones. Restaura un respaldo para retroceder.")
