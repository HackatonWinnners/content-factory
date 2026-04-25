#!/usr/bin/env bash
# Picks the lowest-numbered uncompleted plan in docs/plans/ and runs it via ralphex.
# Cron-safe: refuses to run if another ralphex is already alive (no overlap).
#
# Usage:
#   scripts/ralph-next.sh             # run next plan, blocks until done or limits
#   scripts/ralph-next.sh --serve     # also start web dashboard on :8080
#
# Cron (hourly):
#   0 * * * * cd /Users/madvil2/Projects/content-factory && \
#     ./scripts/ralph-next.sh >> .ralphex/cron.log 2>&1

set -euo pipefail

# Cron has a minimal PATH and no HOME guarantees. Make sure ralphex / claude /
# codex / node / pnpm are findable regardless of how this script is launched.
export HOME="${HOME:-/Users/madvil2}"
export USER="${USER:-$(id -un)}"
export PATH="$HOME/.local/bin:$HOME/.nvm/versions/node/v24.14.1/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

cd "$(dirname "$0")/.."

PLANS_DIR="docs/plans"
EXTRA_ARGS=()

if [[ "${1:-}" == "--serve" ]]; then
	EXTRA_ARGS+=(--serve)
fi

ts() { date -u +%FT%TZ; }

# Refuse to overlap. macOS pgrep doesn't take "$$" exclusion natively; instead
# count ralphex processes started by *this user* and bail if any.
if pgrep -u "$USER" -x ralphex > /dev/null 2>&1; then
	echo "[$(ts)] ralphex already running. Skipping."
	exit 0
fi

# ralphex auto-moves finished plans into docs/plans/completed/. The next plan to
# run is whatever .md is left at the top level, sorted by name.
NEXT_PLAN="$(find "$PLANS_DIR" -maxdepth 1 -name '*.md' -type f 2>/dev/null | sort | head -1)"

if [[ -z "$NEXT_PLAN" ]]; then
	echo "[$(ts)] No plans pending. All complete."
	exit 0
fi

echo "[$(ts)] Running plan: $NEXT_PLAN"
exec ralphex ${EXTRA_ARGS[@]+"${EXTRA_ARGS[@]}"} "$NEXT_PLAN"
