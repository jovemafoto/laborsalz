#!/usr/bin/env bash
set -uo pipefail

PROJECT_ROOT="${LABORSALZ_AI_PROJECT_ROOT:-/Volumes/LaborSalz-Data/03. Projects/LaborSalz AI Studio}"
LOG_DIR="$PROJECT_ROOT/07. Logs/runtime"
STAMP="$(date '+%Y%m%d-%H%M%S')"
REPORT="$LOG_DIR/preflight-$STAMP.txt"

mkdir -p "$LOG_DIR"
exec > >(tee "$REPORT") 2>&1

section() {
  echo
  echo "================================================================"
  echo "$1"
  echo "================================================================"
}

safe_run() {
  echo "+ $*"
  "$@" || echo "[WARN] command exited with status $?"
}

section "LaborSalz AI Studio — server preflight"
echo "Date: $(date)"
echo "Project root: $PROJECT_ROOT"
echo "Report: $REPORT"

section "Host"
safe_run sw_vers
safe_run uname -a
if command -v sysctl >/dev/null 2>&1; then
  echo "CPU: $(sysctl -n machdep.cpu.brand_string 2>/dev/null || true)"
  MEM_BYTES="$(sysctl -n hw.memsize 2>/dev/null || echo 0)"
  if [[ "$MEM_BYTES" =~ ^[0-9]+$ ]] && [[ "$MEM_BYTES" -gt 0 ]]; then
    echo "RAM bytes: $MEM_BYTES"
  fi
fi

section "Volumes and free space"
safe_run df -h "/Volumes/LaborSalz-Data"
if [[ -d "/Volumes/LBZ-Brain" ]]; then
  safe_run df -h "/Volumes/LBZ-Brain"
fi

section "Required project hierarchy"
for dir in   "/Volumes/LaborSalz-Data"   "/Volumes/LaborSalz-Data/03. Projects"; do
  if [[ -d "$dir" ]]; then
    echo "[OK] $dir"
  else
    echo "[MISSING] $dir"
  fi
done

section "Listening services"
if command -v lsof >/dev/null 2>&1; then
  lsof -nP -iTCP -sTCP:LISTEN 2>/dev/null     | grep -E ':(3010|5433|5678|5984|8000|8001|8010|8080|8088|9000|9001|11434|18789)( |$)'     || echo "No known LaborSalz ports found in the filtered list."
else
  echo "lsof not available."
fi

section "Port 3010 availability"
if lsof -nP -iTCP:3010 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "[INFO] Port 3010 is already listening:"
  lsof -nP -iTCP:3010 -sTCP:LISTEN 2>/dev/null || true
else
  echo "[OK] Port 3010 is free."
fi

section "Docker"
if command -v docker >/dev/null 2>&1; then
  safe_run docker --version
  safe_run docker compose version
  if docker info >/dev/null 2>&1; then
    echo "[OK] Docker daemon responds."
    docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}' || true
  else
    echo "[WARN] Docker CLI exists but daemon is not responding."
  fi
else
  echo "[MISSING] Docker CLI."
fi

section "Cloudflare"
if command -v cloudflared >/dev/null 2>&1; then
  safe_run cloudflared --version
  echo
  echo "Visible named tunnels:"
  cloudflared tunnel list 2>&1 || true
else
  echo "[WARN] cloudflared is not in PATH."
fi

echo
echo "Launch services containing cloudflare/laborsalz/n8n:"
launchctl list 2>/dev/null | grep -Ei 'cloudflare|laborsalz|n8n' || true

echo
echo "Known cloudflared LaunchDaemon/LaunchAgent files:"
for plist in   "/Library/LaunchDaemons/com.laborsalz.cloudflared.intel.plist"   "/Library/LaunchDaemons/com.cloudflare.cloudflared.plist"   "$HOME/Library/LaunchAgents/com.laborsalz.cloudflared.intel.plist"   "$HOME/Library/LaunchAgents/com.cloudflare.cloudflared.plist"; do
  if [[ -f "$plist" ]]; then
    echo "-- $plist"
    plutil -p "$plist" 2>/dev/null       | sed -E 's/(--token[[:space:]]+)[^" ]+/\1[REDACTED]/Ig; s/((token|secret|password)[^=:" ]*[=:][[:space:]]*)[^", ]+/\1[REDACTED]/Ig'       || true
  fi
done

echo
echo "Known local cloudflared config candidates:"
for cfg in   "$HOME/.cloudflared/config.yml"   "$HOME/.cloudflared/config.yaml"   "/etc/cloudflared/config.yml"   "/etc/cloudflared/config.yaml"   "/usr/local/etc/cloudflared/config.yml"   "/usr/local/etc/cloudflared/config.yaml"; do
  if [[ -f "$cfg" ]]; then
    echo "-- $cfg"
    sed -E '/(token|secret|password|api[_-]?key)[[:space:]]*:/I s/:.*/: [REDACTED]/' "$cfg" || true
  fi
done

section "Git tooling"
if command -v git >/dev/null 2>&1; then
  safe_run git --version
else
  echo "[MISSING] git"
fi
if command -v gh >/dev/null 2>&1; then
  safe_run gh --version
  gh auth status 2>&1 | sed -E 's/(token:)[[:space:]].*/\1 [REDACTED]/I' || true
else
  echo "[INFO] GitHub CLI (gh) not installed; plain git is enough while repo is public."
fi

section "Existing AI Studio runtime"
if curl -fsS --max-time 3 "http://127.0.0.1:3010/api/v2/health" >/tmp/laborsalz-ai-health.$$ 2>/dev/null; then
  cat /tmp/laborsalz-ai-health.$$
  echo
  rm -f /tmp/laborsalz-ai-health.$$
else
  rm -f /tmp/laborsalz-ai-health.$$ 2>/dev/null || true
  echo "[INFO] No healthy AI Studio found on localhost:3010 yet."
fi

section "Preflight result"
echo "No service configuration was modified by this script."
echo "Saved report: $REPORT"
