"""initial

Revision ID: a1b2c3d4e5f6
Revises:
Create Date: 2026-04-16 00:00:00.000000
"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB, UUID

revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "match_results",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("talent", JSONB(), nullable=False),
        sa.Column("company", JSONB(), nullable=False),
        sa.Column("score", sa.Float(), nullable=False),
        sa.Column("breakdown", JSONB(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
    )

    op.create_table(
        "rank_results",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("company", JSONB(), nullable=False),
        sa.Column("results", JSONB(), nullable=False),
        sa.Column("talent_count", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
    )

    # Index sur created_at pour faciliter les requêtes de reporting
    op.create_index("ix_match_results_created_at", "match_results", ["created_at"])
    op.create_index("ix_rank_results_created_at", "rank_results", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_rank_results_created_at", table_name="rank_results")
    op.drop_index("ix_match_results_created_at", table_name="match_results")
    op.drop_table("rank_results")
    op.drop_table("match_results")
