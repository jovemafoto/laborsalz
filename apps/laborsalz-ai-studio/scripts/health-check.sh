#!/usr/bin/env bash
set -uo pipefail

PROJECT_ROOT="${LABORSALZ_AI_PROJECT_ROOT:-/Volumes/LaborSalz-Data/03. Projects/LaborSalz AI Studio}"
APP_DIR="$PROJECT_ROOT/03. Development/repository/apps/laborsalz-ai-studio"
PORT="${LABORSALZ_AI_PORT:-3010}"
FAILED=0

check() {
  local label="$1"
  shift
  if "$@" >/dev/null 2>&1; then
    echo "[OK] $label"
  else
    echo "[FAIL] $label"
    FAILED=1
  fi
}

echo "LaborSalz AI Studio health — $(date)"
check "LaborSalz-Data mounted" test -d "/Volumes/LaborSalz-Data"
check "App directory exists" test -d "$APP_DIR"
check "Docker daemon" docker info
check "AI Studio container running" docker inspect -f '{{.State.Running}}' laborsalz-ai-studio
check "Local health endpoint" curl -fsS --max-time 10 "http://127.0.0.1:$PORT/api/v2/health"

echo
if curl -fsS --max-time 10 "http://127.0.0.1:$PORT/api/v2/health" 2>/dev/null; then
  echo
fi

if command -v docker >/dev/null 2>&1; then
  echo
  docker ps --filter name=laborsalz-ai-studio     --format 'container={{.Names}} image={{.Image}} status={{.Status}} ports={{.Ports}}' || true
fi

if [[ "$FAILED" -ne 0 ]]; then
  exit 1
fi
