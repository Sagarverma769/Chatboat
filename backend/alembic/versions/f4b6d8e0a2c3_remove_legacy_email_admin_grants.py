"""Remove legacy email-based admin grants."""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f4b6d8e0a2c3"
down_revision: Union[str, Sequence[str], None] = "f3a5b7c9d1e2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


LEGACY_ADMIN_EMAILS = (
    "admin@indsphinx.com",
    "sagar@gmail.com",
    "user@gmail.com",
)
INITIAL_ADMIN_EMAIL = "sagarverma47097@gmail.com"


def upgrade() -> None:
    op.execute(
        sa.text(
            'UPDATE "user" SET is_superuser = FALSE '
            "WHERE LOWER(email) IN (:admin_email, :sagar_email, :user_email) "
            "AND LOWER(email) != :initial_admin_email"
        ).bindparams(
            admin_email=LEGACY_ADMIN_EMAILS[0],
            sagar_email=LEGACY_ADMIN_EMAILS[1],
            user_email=LEGACY_ADMIN_EMAILS[2],
            initial_admin_email=INITIAL_ADMIN_EMAIL,
        )
    )


def downgrade() -> None:
    pass
