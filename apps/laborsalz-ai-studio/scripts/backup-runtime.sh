#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="${LABORSALZ_AI_PROJECT_ROOT:-/Volumes/LaborSalz-Data/03. Projects/LaborSalz AI Studio}"
RUNTIME_DIR="$PROJECT_ROOT/04. Assets/runtime"
BACKUP_DIR="$PROJECT_ROOT/99. Archive/runtime-backups"
STAMP="$(date '+%Y%m%d-%H%M%S')"
FULL_MEDIA="${FULL_MEDIA:-0}"

mkdir -p "$BACKUP_DIR"

if [[ ! -d "$RUNTIME_DIR" ]]; then
  echo "ERROR: runtime directory not found: $RUNTIME_DIR"
  exit 1
fi

ITEMS=()
for name in history events; do
  [[ -e "$RUNTIME_DIR/$name" ]] && ITEMS+=("$name")
done
if [[ "$FULL_MEDIA" == "1" ]]; then
  for name in uploads results; do
    [[ -e "$RUNTIME_DIR/$name" ]] && ITEMS+=("$name")
  done
fi

if [[ "${#ITEMS[@]}" -eq 0 ]]; then
  echo "Nothing to back up yet."
  exit 0
fi

ARCHIVE="$BACKUP_DIR/runtime-$STAMP.tar.gz"
(
  cd "$RUNTIME_DIR"
  tar -czf "$ARCHIVE" "${ITEMS[@]}"
)

if command -v shasum >/dev/null 2>&1; then
  shasum -a 256 "$ARCHIVE" > "$ARCHIVE.sha256"
fi

echo "Backup created: $ARCHIVE"
if [[ "$FULL_MEDIA" != "1" ]]; then
  echo "Metadata-only backup: history + events."
  echo "Run with FULL_MEDIA=1 to include uploads/results (can be very large)."
fi
