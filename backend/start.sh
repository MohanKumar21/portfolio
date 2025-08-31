#!/usr/bin/env bash
set -e

# Default to 8000 if $PORT is not set (useful for local dev)
PORT=${PORT:-8000}

echo "Starting Uvicorn on 0.0.0.0:${PORT} ..."
exec uvicorn server:app --host 0.0.0.0 --port $PORT
