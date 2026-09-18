#!/usr/bin/env bash
set -uo pipefail

PROJECT_ROOT="${LABORSALZ_AI_PROJECT_ROOT:-/Volumes/LaborSalz-Data/03. Projects/LaborSalz AI Studio}"
APP_DIR="$PROJECT_ROOT/03. Development/repository/apps/laborsalz-ai-studio"
PORT="${LABORSALZ_AI_PORT:-3010}"

echo "[$(date)] AI Studio guard"

if ! docker info >/dev/null 2>&1; then
  echo "Docker daemon unavailable; guard made no changes."
  exit 0
fi

if curl -fsS --max-time 5 "http://127.0.0.1:$PORT/api/v2/health" >/dev/null 2>&1; then
  echo "AI Studio healthy."
  exit 0
fi

if [[ ! -d "$APP_DIR" || ! -f "$APP_DIR/.env" ]]; then
  echo "AI Studio is not bootstrapped yet."
  exit 0
fi

echo "Health check failed while Docker is available; ensuring compose service is up."
cd "$APP_DIR"
docker compose up -d

sleep 12
if curl -fsS --max-time 5 "http://127.0.0.1:$PORT/api/v2/health" >/dev/null 2>&1; then
  echo "AI Studio recovered."
  exit 0
fi

echo "AI Studio remains unhealthy after compose up."
docker compose ps || true
exit 1
