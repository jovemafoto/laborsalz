#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="${LABORSALZ_AI_PROJECT_ROOT:-/Volumes/LaborSalz-Data/03. Projects/LaborSalz AI Studio}"
APP_DIR="$PROJECT_ROOT/03. Development/repository/apps/laborsalz-ai-studio"
LOG_DIR="$PROJECT_ROOT/07. Logs/runtime"
AGENT_DIR="$HOME/Library/LaunchAgents"
UID_VALUE="$(id -u)"

mkdir -p "$AGENT_DIR" "$LOG_DIR"

GUARD_PLIST="$AGENT_DIR/com.laborsalz.ai-studio.guard.plist"
BACKUP_PLIST="$AGENT_DIR/com.laborsalz.ai-studio.backup.plist"

cat > "$GUARD_PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.laborsalz.ai-studio.guard</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>$APP_DIR/scripts/ensure-running.sh</string>
  </array>
  <key>StartInterval</key>
  <integer>300</integer>
  <key>RunAtLoad</key>
  <true/>
  <key>StandardOutPath</key>
  <string>$LOG_DIR/guard.log</string>
  <key>StandardErrorPath</key>
  <string>$LOG_DIR/guard-error.log</string>
</dict>
</plist>
EOF

cat > "$BACKUP_PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.laborsalz.ai-studio.backup</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>$APP_DIR/scripts/backup-runtime.sh</string>
  </array>
  <key>StartCalendarInterval</key>
  <dict>
    <key>Hour</key>
    <integer>3</integer>
    <key>Minute</key>
    <integer>20</integer>
  </dict>
  <key>StandardOutPath</key>
  <string>$LOG_DIR/backup.log</string>
  <key>StandardErrorPath</key>
  <string>$LOG_DIR/backup-error.log</string>
</dict>
</plist>
EOF

chmod 600 "$GUARD_PLIST" "$BACKUP_PLIST"

for label in com.laborsalz.ai-studio.guard com.laborsalz.ai-studio.backup; do
  launchctl bootout "gui/$UID_VALUE/$label" >/dev/null 2>&1 || true
done

launchctl bootstrap "gui/$UID_VALUE" "$GUARD_PLIST"
launchctl bootstrap "gui/$UID_VALUE" "$BACKUP_PLIST"
launchctl enable "gui/$UID_VALUE/com.laborsalz.ai-studio.guard" || true
launchctl enable "gui/$UID_VALUE/com.laborsalz.ai-studio.backup" || true

echo "Installed:"
echo "  com.laborsalz.ai-studio.guard — every 5 minutes"
echo "  com.laborsalz.ai-studio.backup — daily at 03:20"
echo
launchctl print "gui/$UID_VALUE/com.laborsalz.ai-studio.guard" | head -n 25 || true
launchctl print "gui/$UID_VALUE/com.laborsalz.ai-studio.backup" | head -n 25 || true
