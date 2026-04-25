#!/usr/bin/env bash
# Runs ALL pending plans sequentially in one foreground session.
# Use this for "kick off and walk away" — runs until docs/plans/ has no
# uncompleted .md files, or until ralphex returns a non-zero exit.
#
# Usage:
#   scripts/ralph-loop.sh             # foreground, watches CLI output
#   scripts/ralph-loop.sh --serve     # also expose dashboard on :8080
#   caffeinate -is scripts/ralph-loop.sh   # macOS: prevent sleep during overnight run
#
# To run in the background and detach:
#   nohup ./scripts/ralph-loop.sh >> .ralphex/loop.log 2>&1 &

set -euo pipefail

cd "$(dirname "$0")/.."

PLANS_DIR="docs/plans"
EXTRA_ARGS=()

if [[ "${1:-}" == "--serve" ]]; then
	EXTRA_ARGS+=(--serve)
fi

ts() { date -u +%FT%TZ; }

while :; do
	NEXT_PLAN="$(find "$PLANS_DIR" -maxdepth 1 -name '*.md' -type f 2>/dev/null | sort | head -1)"
	if [[ -z "$NEXT_PLAN" ]]; then
		echo "[$(ts)] All plans complete. Exiting."
		exit 0
	fi

	echo "[$(ts)] === Starting plan: $NEXT_PLAN ==="
	if ! ralphex "${EXTRA_ARGS[@]}" "$NEXT_PLAN"; then
		ec=$?
		echo "[$(ts)] !! ralphex exited with $ec on $NEXT_PLAN. Stopping loop."
		exit "$ec"
	fi
	echo "[$(ts)] === Finished plan: $NEXT_PLAN ==="
done
