"""Keep user and admin ticket deletion independent."""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c7d31a2b8e40"
down_revision: Union[str, Sequence[str], None] = "fa72c8111b02"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    if "support_tickets" not in sa.inspect(bind).get_table_names():
        return

    existing_columns = {
        column["name"] for column in sa.inspect(bind).get_columns("support_tickets")
    }
    for column_name in ("hidden_from_admin", "hidden_from_user"):
        if column_name not in existing_columns:
            op.add_column(
                "support_tickets",
                sa.Column(
                    column_name,
                    sa.Boolean(),
                    nullable=False,
                    server_default=sa.false(),
                ),
            )


def downgrade() -> None:
    existing_columns = {
        column["name"]
        for column in sa.inspect(op.get_bind()).get_columns("support_tickets")
    }
    for column_name in ("hidden_from_user", "hidden_from_admin"):
        if column_name in existing_columns:
            op.drop_column("support_tickets", column_name)
