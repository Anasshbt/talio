# ──────────────────────────────────────────────────────────────────────────────
# Build context = repo root (talio/)
# All COPY paths are relative to that root.
# ──────────────────────────────────────────────────────────────────────────────

FROM python:3.12-slim

# Install runtime deps (curl for healthcheck)
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

# Install uv from official image (pinned major version)
COPY --from=ghcr.io/astral-sh/uv:0.4 /uv /usr/local/bin/uv

# ── Security: non-root user ───────────────────────────────────────────────────
RUN groupadd -r app && useradd -r -g app -d /app -s /sbin/nologin app

WORKDIR /app

# ── Dependencies (separate layer for caching) ─────────────────────────────────
COPY exercice1/backend/pyproject.toml ./
# uv.lock is optional — if present it pins exact versions (reproducible builds)
RUN uv sync --no-dev --no-install-project

# ── Application source ────────────────────────────────────────────────────────
COPY exercice1/backend/app      ./app
COPY exercice1/backend/alembic  ./alembic
COPY exercice1/backend/alembic.ini ./alembic.ini

# ── Entrypoint ────────────────────────────────────────────────────────────────
COPY exercice2/backend/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Fix ownership before switching user
RUN chown -R app:app /app

USER app

EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]
