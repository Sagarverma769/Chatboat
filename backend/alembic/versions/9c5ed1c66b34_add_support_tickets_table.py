"""Add support tickets table

Revision ID: 9c5ed1c66b34
Revises: b4c1d7e9a210
Create Date: 2026-09-30 14:32:02.829015

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9c5ed1c66b34'
down_revision: Union[str, Sequence[str], None] = 'b4c1d7e9a210'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
