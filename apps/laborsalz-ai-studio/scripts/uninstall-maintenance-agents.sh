#!/usr/bin/env bash
set -euo pipefail

AGENT_DIR="$HOME/Library/LaunchAgents"
UID_VALUE="$(id -u)"

for label in com.laborsalz.ai-studio.guard com.laborsalz.ai-studio.backup; do
  launchctl bootout "gui/$UID_VALUE/$label" >/dev/null 2>&1 || true
  rm -f "$AGENT_DIR/$label.plist"
done

echo "LaborSalz AI Studio maintenance LaunchAgents removed."
