"""Expand support tickets for the user helpdesk workflow."""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "fa72c8111b02"
down_revision: Union[str, Sequence[str], None] = "9c5ed1c66b34"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    if "support_tickets" not in sa.inspect(bind).get_table_names():
        op.create_table(
            "support_tickets",
            sa.Column("id", sa.Integer(), primary_key=True, index=True),
            sa.Column("user_id", sa.String(), nullable=True),
            sa.Column("user_email", sa.String(), nullable=False),
            sa.Column("user_name", sa.String(), nullable=True),
            sa.Column("unit", sa.String(), nullable=True),
            sa.Column("location", sa.String(), nullable=True),
            sa.Column("device_ip", sa.String(), nullable=True),
            sa.Column("assigned_member", sa.String(), nullable=False, server_default="Any Available IT Specialist"),
            sa.Column("category", sa.String(), nullable=False, server_default="Software"),
            sa.Column("priority", sa.String(), nullable=False, server_default="Medium"),
            sa.Column("title", sa.String(), nullable=True),
            sa.Column("query", sa.Text(), nullable=False),
            sa.Column("bot_response", sa.Text(), nullable=True),
            sa.Column("resolution_notes", sa.Text(), nullable=True),
            sa.Column("status", sa.String(), nullable=False, server_default="Pending"),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True, server_default=sa.func.now()),
        )
        return

    existing_columns = {column["name"] for column in sa.inspect(bind).get_columns("support_tickets")}
    new_columns = (
        sa.Column("user_name", sa.String(), nullable=True),
        sa.Column("unit", sa.String(), nullable=True),
        sa.Column("location", sa.String(), nullable=True),
        sa.Column("device_ip", sa.String(), nullable=True),
        sa.Column("assigned_member", sa.String(), nullable=True),
        sa.Column("category", sa.String(), nullable=True),
        sa.Column("priority", sa.String(), nullable=True),
        sa.Column("title", sa.String(), nullable=True),
        sa.Column("resolution_notes", sa.Text(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    for column in new_columns:
        if column.name not in existing_columns:
            op.add_column("support_tickets", column)

    updated_columns = {column["name"] for column in sa.inspect(bind).get_columns("support_tickets")}
    if "created_at" in updated_columns and "updated_at" in updated_columns:
        op.execute(sa.text("UPDATE support_tickets SET updated_at = created_at WHERE updated_at IS NULL"))
    if "status" in updated_columns:
        op.execute(sa.text("UPDATE support_tickets SET status = 'Pending' WHERE status = 'Open'"))


def downgrade() -> None:
    existing_columns = {column["name"] for column in sa.inspect(op.get_bind()).get_columns("support_tickets")}
    for column_name in (
        "updated_at",
        "resolution_notes",
        "title",
        "priority",
        "category",
        "assigned_member",
        "device_ip",
        "location",
        "unit",
        "user_name",
    ):
        if column_name in existing_columns:
            op.drop_column("support_tickets", column_name)