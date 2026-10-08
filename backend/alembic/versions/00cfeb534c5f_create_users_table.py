"""create users table

Revision ID: 00cfeb534c5f
Revises: 342f7ef8c4d9
Create Date: 2026-09-24 10:46:29.126381

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '00cfeb534c5f'
down_revision: Union[str, Sequence[str], None] = '342f7ef8c4d9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
