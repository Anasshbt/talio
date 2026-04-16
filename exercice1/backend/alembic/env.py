"""Alembic environment — async SQLAlchemy + DATABASE_URL depuis l'environnement."""

from __future__ import annotations

import asyncio
import os
import sys
from logging.config import fileConfig
from pathlib import Path

# Ajoute le dossier backend/ au sys.path pour que `from app.xxx import` fonctionne
# peu importe le répertoire depuis lequel alembic est lancé.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from alembic import context
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine

# Charge les variables du fichier .env si présent
load_dotenv()

# Objet de configuration Alembic (issu de alembic.ini)
config = context.config

if config.config_file_name:
    fileConfig(config.config_file_name)

# Import des métadonnées des modèles pour l'autogenerate
from app.db_models import Base  # noqa: E402

target_metadata = Base.metadata


def get_url() -> str:
    """Lit DATABASE_URL depuis l'environnement — jamais en dur dans le code."""
    url = os.environ.get("DATABASE_URL")
    if not url:
        raise RuntimeError(
            "DATABASE_URL n'est pas défini. "
            "Copiez backend/.env.example en backend/.env et renseignez vos credentials."
        )
    return url


# ─── Mode offline (génération SQL sans connexion) ─────────────────────────────

def run_migrations_offline() -> None:
    context.configure(
        url=get_url(),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


# ─── Mode online (connexion async réelle) ─────────────────────────────────────

def do_run_migrations(connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    connectable = create_async_engine(get_url())
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
