#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="${LABORSALZ_AI_PROJECT_ROOT:-/Volumes/LaborSalz-Data/03. Projects/LaborSalz AI Studio}"
REPO_DIR="$PROJECT_ROOT/03. Development/repository"
APP_DIR="$REPO_DIR/apps/laborsalz-ai-studio"
RUNTIME_DIR="$PROJECT_ROOT/04. Assets/runtime"
LOG_DIR="$PROJECT_ROOT/07. Logs/runtime"
BRANCH="feature/laborsalz-ai-studio"
REPO_URL="https://github.com/jovemafoto/laborsalz.git"
PORT="${LABORSALZ_AI_PORT:-3010}"

echo "== LaborSalz AI Studio bootstrap =="
echo "Project: $PROJECT_ROOT"

if [[ ! -d "/Volumes/LaborSalz-Data" ]]; then
  echo "ERROR: /Volumes/LaborSalz-Data is not mounted."
  exit 1
fi

mkdir -p \
  "$PROJECT_ROOT/00. Context" \
  "$PROJECT_ROOT/01. Brand" \
  "$PROJECT_ROOT/02. Design" \
  "$PROJECT_ROOT/03. Development" \
  "$PROJECT_ROOT/04. Assets" \
  "$PROJECT_ROOT/05. Documents" \
  "$PROJECT_ROOT/06. Deliveries" \
  "$PROJECT_ROOT/07. Logs" \
  "$PROJECT_ROOT/90. Inbox" \
  "$PROJECT_ROOT/99. Archive" \
  "$RUNTIME_DIR/uploads" \
  "$RUNTIME_DIR/history" \
  "$RUNTIME_DIR/events" \
  "$LOG_DIR"

if [[ -d "$REPO_DIR/.git" ]]; then
  echo "Updating existing repository without destructive reset..."
  git -C "$REPO_DIR" fetch origin "$BRANCH"
  git -C "$REPO_DIR" checkout "$BRANCH"
  git -C "$REPO_DIR" pull --ff-only origin "$BRANCH"
else
  if [[ -e "$REPO_DIR" ]]; then
    echo "ERROR: $REPO_DIR exists but is not a Git repository. Nothing was changed."
    exit 1
  fi
  git clone --branch "$BRANCH" --single-branch "$REPO_URL" "$REPO_DIR"
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: Docker CLI not found."
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "Docker daemon is not responding. Trying known LaborSalz Mac runtimes..."
  if command -v colima >/dev/null 2>&1; then
    colima start || true
  elif [[ -d "/Applications/Docker.app" ]]; then
    open -a Docker || true
  fi
  echo "Waiting up to 90 seconds for Docker..."
  for _ in {1..30}; do
    docker info >/dev/null 2>&1 && break
    sleep 3
  done
fi

if ! docker info >/dev/null 2>&1; then
  echo "ERROR: Docker daemon is still unavailable. Repository and folders are ready; runtime was not changed."
  exit 2
fi

cd "$APP_DIR"

if [[ ! -f .env ]]; then
  echo
  read -r -p "Generation API base URL (HF_API_BASE_URL): " HF_API_BASE_URL
  read -r -s -p "Generation platform key (id:secret): " LABORSALZ_AI_API_KEY
  echo
  if [[ -z "$HF_API_BASE_URL" || -z "$LABORSALZ_AI_API_KEY" ]]; then
    echo "ERROR: API URL and key are required to start generation."
    exit 3
  fi

  MEDIA_SECRET="$(openssl rand -hex 32)"
  INTERNAL_TOKEN="$(openssl rand -hex 32)"
  umask 077
  cat > .env <<EOF
NEXT_PUBLIC_SITE_URL=https://ai.laborsalz.com
NEXT_PUBLIC_STUDIO_NAME=LaborSalz AI Studio
HF_API_BASE_URL=$HF_API_BASE_URL
LABORSALZ_AI_API_KEY=$LABORSALZ_AI_API_KEY
LABORSALZ_STORAGE_ROOT=/data
LABORSALZ_AI_STORAGE_HOST="$RUNTIME_DIR"
LABORSALZ_AI_PORT=$PORT
LABORSALZ_UPLOAD_MAX_MB=150
LABORSALZ_HISTORY_LIMIT=1000
LABORSALZ_MEDIA_SIGNING_SECRET=$MEDIA_SECRET
LABORSALZ_INTERNAL_API_TOKEN=$INTERNAL_TOKEN
N8N_EVENT_WEBHOOK_URL=
EOF
  chmod 600 .env
  echo ".env created with mode 600. Secrets were not printed."
else
  echo "Existing .env preserved."
fi

echo "Building container..."
docker compose build

echo "Starting service..."
docker compose up -d

echo "Waiting for health endpoint..."
for _ in {1..30}; do
  if curl -fsS "http://127.0.0.1:$PORT/api/v2/health" >/dev/null 2>&1; then
    echo
    curl -fsS "http://127.0.0.1:$PORT/api/v2/health"
    echo
    echo "AI Studio is healthy on localhost:$PORT"
    echo "Next step: route ai.laborsalz.com through the existing Cloudflare Tunnel to http://localhost:$PORT."
    exit 0
  fi
  sleep 3
done

echo "ERROR: container started but health endpoint did not become ready."
docker compose ps
docker compose logs --tail=120 ai-studio
exit 4
