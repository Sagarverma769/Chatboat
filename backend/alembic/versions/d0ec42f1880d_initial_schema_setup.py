"""Initial schema setup

Revision ID: d0ec42f1880d
Revises: 00cfeb534c5f
Create Date: 2026-09-24 12:23:02.457032

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd0ec42f1880d'
down_revision: Union[str, Sequence[str], None] = '00cfeb534c5f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
