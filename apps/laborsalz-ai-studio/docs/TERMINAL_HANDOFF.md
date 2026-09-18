# Terminal handoff — LaborSalz AI Studio

These blocks are designed for the LaborSalz Mac mini. They are additive and
avoid destructive resets or recursive permission changes.

## Block A — map, clone/update, build, start, guard and verify

```bash
set -euo pipefail

export PATH="/usr/local/bin:/opt/homebrew/bin:/Applications/Docker.app/Contents/Resources/bin:$PATH"

PROJECT_ROOT="/Volumes/LaborSalz-Data/03. Projects/LaborSalz AI Studio"
REPO_DIR="$PROJECT_ROOT/03. Development/repository"
APP_DIR="$REPO_DIR/apps/laborsalz-ai-studio"
REPO_URL="https://github.com/jovemafoto/laborsalz.git"
BRANCH="feature/laborsalz-ai-studio"

echo "== LaborSalz AI Studio — complete server handoff =="

if [[ ! -d "/Volumes/LaborSalz-Data" ]]; then
  echo "ERROR: /Volumes/LaborSalz-Data is not mounted."
  exit 1
fi

mkdir -p "$PROJECT_ROOT/03. Development"

if [[ ! -d "$REPO_DIR/.git" ]]; then
  if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
    gh auth setup-git >/dev/null 2>&1 || true
  fi
  git clone --branch "$BRANCH" --single-branch "$REPO_URL" "$REPO_DIR"
else
  git -C "$REPO_DIR" fetch origin "$BRANCH"
  git -C "$REPO_DIR" checkout "$BRANCH"
  git -C "$REPO_DIR" pull --ff-only origin "$BRANCH"
fi

cd "$APP_DIR"

echo
echo ">>> 1/5 Server preflight"
bash scripts/server-preflight.sh

echo
echo ">>> 2/5 Bootstrap and production Docker build"
bash scripts/bootstrap-server.sh

echo
echo ">>> 3/5 Install maintenance LaunchAgents"
bash scripts/install-maintenance-agents.sh

echo
echo ">>> 4/5 Local health validation"
bash scripts/health-check.sh

echo
echo ">>> 5/5 Initial metadata backup"
bash scripts/backup-runtime.sh

echo
echo "=== FINAL STATE ==="
docker compose ps
echo
curl -fsS http://127.0.0.1:3010/api/v2/health
echo
echo
echo "Project root: $PROJECT_ROOT"
echo "App:          $APP_DIR"
echo "Runtime:      $PROJECT_ROOT/04. Assets/runtime"
echo "Logs:         $PROJECT_ROOT/07. Logs/runtime"
echo
echo "Local AI Studio deployment is complete."
echo "Cloudflare is intentionally handled in Block B after live tunnel inspection."
```

The bootstrap requests only the Higgsfield `KEY_ID:KEY_SECRET`. The API origin
defaults to `https://platform.higgsfield.ai`.

## Block B — Cloudflare live inspection, no destructive edit

```bash
set -euo pipefail

APP_DIR="/Volumes/LaborSalz-Data/03. Projects/LaborSalz AI Studio/03. Development/repository/apps/laborsalz-ai-studio"

cd "$APP_DIR"

echo "== Cloudflare live audit =="
bash scripts/cloudflare-plan.sh
echo
bash scripts/cloudflare-route-dns.sh
echo
echo "== Relevant launch services =="
launchctl list | grep -Ei 'cloudflare|laborsalz' || true
echo
echo "== Local AI Studio =="
curl -fsS http://127.0.0.1:3010/api/v2/health
echo
echo
echo "Do not overwrite the current production tunnel config."
echo "Use the output above to confirm the live tunnel and config path first."
```

After the live tunnel is confirmed, the repository already contains:

- `deploy/cloudflare/ingress-snippet.yml`
- `scripts/cloudflare-route-dns.sh`
- `docs/CLOUDFLARE.md`

## Routine operations

```bash
APP_DIR="/Volumes/LaborSalz-Data/03. Projects/LaborSalz AI Studio/03. Development/repository/apps/laborsalz-ai-studio"

bash "$APP_DIR/scripts/health-check.sh"
bash "$APP_DIR/scripts/update-server.sh"
bash "$APP_DIR/scripts/backup-runtime.sh"
```

For a full media backup:

```bash
FULL_MEDIA=1 bash "$APP_DIR/scripts/backup-runtime.sh"
```
