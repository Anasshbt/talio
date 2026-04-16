"""
Structured JSON logging configuration.

Every log line is a JSON object parseable by ELK / Loki / CloudWatch:
  {"timestamp": "...", "level": "INFO", "logger": "app", "message": "..."}
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone


class JsonFormatter(logging.Formatter):
    """Emits one JSON object per log record on a single line."""

    def format(self, record: logging.LogRecord) -> str:
        payload: dict = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level":     record.levelname,
            "logger":    record.name,
            "message":   record.getMessage(),
        }
        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)
        # Carry-along extra fields (e.g. request_id, path, status_code)
        for key in ("request_id", "method", "path", "status_code", "duration_ms"):
            if hasattr(record, key):
                payload[key] = getattr(record, key)
        return json.dumps(payload, ensure_ascii=False)


LOGGING_CONFIG: dict = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "json": {"()": "app.logging_config.JsonFormatter"},
    },
    "handlers": {
        "console": {
            "class":     "logging.StreamHandler",
            "formatter": "json",
            "stream":    "ext://sys.stdout",
        },
    },
    "root": {
        "level":    "INFO",
        "handlers": ["console"],
    },
    "loggers": {
        "uvicorn":        {"level": "INFO",    "handlers": ["console"], "propagate": False},
        "uvicorn.error":  {"level": "INFO",    "handlers": ["console"], "propagate": False},
        "uvicorn.access": {"level": "INFO",    "handlers": ["console"], "propagate": False},
        "sqlalchemy.engine": {"level": "WARNING", "handlers": ["console"], "propagate": False},
        "app":            {"level": "INFO",    "handlers": ["console"], "propagate": False},
    },
}
