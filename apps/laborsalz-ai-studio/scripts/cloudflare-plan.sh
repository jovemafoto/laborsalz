#!/usr/bin/env bash
set -euo pipefail

PORT="${LABORSALZ_AI_PORT:-3010}"
HOSTNAME="${LABORSALZ_AI_HOSTNAME:-ai.laborsalz.com}"

echo "== Cloudflare plan for LaborSalz AI Studio =="
echo "Hostname: $HOSTNAME"
echo "Origin:   http://localhost:$PORT"
echo

if command -v cloudflared >/dev/null 2>&1; then
  echo "-- cloudflared version --"
  cloudflared --version || true
  echo
  echo "-- visible tunnels --"
  cloudflared tunnel list || true
else
  echo "cloudflared CLI was not found in PATH."
fi

cat <<EOF

Recommended ingress entry (add BEFORE the final catch-all):
  - hostname: $HOSTNAME
    service: http://localhost:$PORT
    originRequest:
      connectTimeout: 10s
      noHappyEyeballs: false

Cloudflare Access:
  1. Protect https://$HOSTNAME/* with an Allow policy for LaborSalz users.
  2. Add a higher-priority BYPASS policy ONLY for:
       https://$HOSTNAME/api/v2/media/*
     These media URLs are HMAC-signed and expire; external generation providers
     must be able to fetch them without an interactive Access login.
  3. Keep /api/v2/generate and /api/v2/status/* behind Access and the internal
     Bearer token.

Do not overwrite the current tunnel config automatically: this server already
hosts production tunnel routes.
EOF
