#!/usr/bin/env bash
set -euo pipefail

HOSTNAME="${LABORSALZ_AI_HOSTNAME:-ai.laborsalz.com}"
TUNNEL_NAME="${TUNNEL_NAME:-laborsalz-intel}"
APPLY="${APPLY:-0}"

if ! command -v cloudflared >/dev/null 2>&1; then
  echo "ERROR: cloudflared not found."
  exit 1
fi

echo "Hostname: $HOSTNAME"
echo "Candidate tunnel: $TUNNEL_NAME"
echo
cloudflared tunnel list || true
echo

if [[ "$APPLY" != "1" ]]; then
  echo "DRY RUN ONLY."
  echo "If the candidate tunnel above is confirmed, run:"
  echo "  APPLY=1 TUNNEL_NAME='$TUNNEL_NAME' bash '$0'"
  exit 0
fi

echo "Creating/updating the DNS route only. This does NOT modify ingress config."
cloudflared tunnel route dns "$TUNNEL_NAME" "$HOSTNAME"
echo "DNS route requested for $HOSTNAME -> $TUNNEL_NAME"
echo "Now add deploy/cloudflare/ingress-snippet.yml to the live tunnel ingress config and validate it."
