#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="${LABORSALZ_AI_PROJECT_ROOT:-/Volumes/LaborSalz-Data/03. Projects/LaborSalz AI Studio}"
REPO_DIR="$PROJECT_ROOT/03. Development/repository"
APP_DIR="$REPO_DIR/apps/laborsalz-ai-studio"
BRANCH="feature/laborsalz-ai-studio"
PORT="${LABORSALZ_AI_PORT:-3010}"

if [[ ! -d "$REPO_DIR/.git" ]]; then
  echo "ERROR: repository not found at $REPO_DIR"
  exit 1
fi

if ! git -C "$REPO_DIR" diff --quiet || ! git -C "$REPO_DIR" diff --cached --quiet; then
  echo "ERROR: repository has local tracked changes. Nothing was updated."
  git -C "$REPO_DIR" status --short
  exit 2
fi

echo "Fetching $BRANCH..."
git -C "$REPO_DIR" fetch origin "$BRANCH"
git -C "$REPO_DIR" checkout "$BRANCH"
git -C "$REPO_DIR" pull --ff-only origin "$BRANCH"

cd "$APP_DIR"
if [[ ! -f .env ]]; then
  echo "ERROR: .env is missing. Run bootstrap-server.sh first."
  exit 3
fi

echo "Building new image..."
docker compose build

echo "Applying container update..."
docker compose up -d --remove-orphans

echo "Waiting for health..."
for _ in {1..30}; do
  if curl -fsS --max-time 5 "http://127.0.0.1:$PORT/api/v2/health" >/dev/null 2>&1; then
    curl -fsS "http://127.0.0.1:$PORT/api/v2/health"
    echo
    echo "Update completed."
    exit 0
  fi
  sleep 3
done

echo "ERROR: updated container did not become healthy."
docker compose ps
docker compose logs --tail=150 ai-studio
exit 4
