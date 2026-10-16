"""Add fields for expiring login OTPs."""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e2f4a6c8d0b1"
down_revision: Union[str, Sequence[str], None] = "c7d31a2b8e40"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    existing_columns = {
        column["name"] for column in sa.inspect(op.get_bind()).get_columns("user")
    }
    if "mfa_otp_hash" not in existing_columns:
        op.add_column("user", sa.Column("mfa_otp_hash", sa.String(length=64), nullable=True))
    if "mfa_otp_expires_at" not in existing_columns:
        op.add_column("user", sa.Column("mfa_otp_expires_at", sa.DateTime(timezone=True), nullable=True))
    if "mfa_otp_attempts" not in existing_columns:
        op.add_column(
            "user",
            sa.Column("mfa_otp_attempts", sa.Integer(), nullable=False, server_default="0"),
        )


def downgrade() -> None:
    existing_columns = {
        column["name"] for column in sa.inspect(op.get_bind()).get_columns("user")
    }
    for column_name in ("mfa_otp_attempts", "mfa_otp_expires_at", "mfa_otp_hash"):
        if column_name in existing_columns:
            op.drop_column("user", column_name)
