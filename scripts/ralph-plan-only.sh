#!/usr/bin/env bash
# Runs ralphex --plan="$1" but stops after the plan is generated, before
# task execution starts. Detects the RALPHEX:PLAN_READY signal in stdout,
# then SIGTERMs ralphex.
#
# Usage:
#   scripts/ralph-plan-only.sh "describe what you want planned"
#
# Output:
#   - Streams ralphex output to stdout
#   - Leaves the new plan file in docs/plans/ for review
#   - Exits 0 if plan was generated, non-zero otherwise

set -euo pipefail

export HOME="${HOME:-/Users/madvil2}"
export USER="${USER:-$(id -un)}"
export PATH="$HOME/.local/bin:$HOME/.nvm/versions/node/v24.14.1/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

cd "$(dirname "$0")/.."

if [[ $# -lt 1 ]]; then
	echo "usage: $0 \"plan description\""
	exit 1
fi

DESC="$1"
LOG="$(mktemp -t ralph-plan-XXXX.log)"

echo "[$(date -u +%FT%TZ)] Asking ralphex to write a plan."
echo "[$(date -u +%FT%TZ)] Log: $LOG"
echo "[$(date -u +%FT%TZ)] Will stop ralphex as soon as <<<RALPHEX:PLAN_READY>>> appears."
echo

# Run ralphex in background with output to a log we tail. We use --tasks-only
# to skip the review/finalize phases (they trigger after task execution which
# we don't want to start). We still need the kill though, because tasks-only
# still proceeds to task execution after plan generation.
ralphex --plan="$DESC" > "$LOG" 2>&1 &
RPID=$!

cleanup() {
	# Kill ralphex tree if still alive
	if kill -0 "$RPID" 2>/dev/null; then
		echo "[$(date -u +%FT%TZ)] Stopping ralphex (pid=$RPID)..."
		pkill -P "$RPID" 2>/dev/null || true
		kill "$RPID" 2>/dev/null || true
		sleep 1
		kill -9 "$RPID" 2>/dev/null || true
	fi
}
trap cleanup EXIT INT TERM

# Tail and watch for the signal
( tail -f "$LOG" --pid "$RPID" 2>/dev/null & echo $! > /tmp/ralph-tail.pid; wait ) &
TAIL_PID=$(cat /tmp/ralph-tail.pid 2>/dev/null || true)

while kill -0 "$RPID" 2>/dev/null; do
	if grep -q "RALPHEX:PLAN_READY" "$LOG" 2>/dev/null; then
		echo
		echo "[$(date -u +%FT%TZ)] Plan ready signal detected. Stopping ralphex."
		cleanup
		break
	fi
	sleep 2
done

# Tail child cleanup
[[ -n "${TAIL_PID:-}" ]] && kill "$TAIL_PID" 2>/dev/null || true

echo
echo "[$(date -u +%FT%TZ)] Plan files in docs/plans/ (newest first):"
ls -lt docs/plans/*.md 2>/dev/null | head -8
echo
echo "Read the new plan, then to execute:  ralphex --serve docs/plans/<file>.md"
