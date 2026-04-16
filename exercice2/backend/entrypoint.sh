#!/bin/sh
# Entrypoint: run Alembic migrations then start uvicorn.
# Exits immediately on any error (fail-fast).
set -e

echo '{"timestamp":"'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'","level":"INFO","logger":"entrypoint","message":"Running database migrations"}'
uv run alembic upgrade head

echo '{"timestamp":"'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'","level":"INFO","logger":"entrypoint","message":"Starting uvicorn"}'
exec uv run uvicorn app.main:app \
    --host 0.0.0.0 \
    --port 8000 \
    --workers 1 \
    --log-level info \
    --access-log
