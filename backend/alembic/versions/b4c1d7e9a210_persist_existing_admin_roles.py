"""Persist accounts previously granted admin access by email allowlists."""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b4c1d7e9a210'
down_revision: Union[str, Sequence[str], None] = 'd0ec42f1880d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


ADMIN_EMAILS = ('admin@indsphinx.com', 'sagar@gmail.com', 'user@gmail.com')


def upgrade() -> None:
    op.execute(
        sa.text(
            'UPDATE "user" SET is_superuser = TRUE '
            'WHERE LOWER(email) IN (:admin_email, :sagar_email, :user_email)'
        ).bindparams(
            admin_email=ADMIN_EMAILS[0],
            sagar_email=ADMIN_EMAILS[1],
            user_email=ADMIN_EMAILS[2],
        )
    )


def downgrade() -> None:
    op.execute(
        sa.text(
            'UPDATE "user" SET is_superuser = FALSE '
            'WHERE LOWER(email) IN (:admin_email, :sagar_email, :user_email)'
        ).bindparams(
            admin_email=ADMIN_EMAILS[0],
            sagar_email=ADMIN_EMAILS[1],
            user_email=ADMIN_EMAILS[2],
        )
    )