#!/usr/bin/env bash
# Picks the lowest-numbered uncompleted plan in docs/plans/ and runs it via ralphex.
# Designed to be cron-safe: idempotent, exits cleanly when nothing to do, all
# output to stdout/stderr.
#
# Usage:
#   scripts/ralph-next.sh             # run next plan, blocks until done or limits
#   scripts/ralph-next.sh --serve     # also start web dashboard on :8080
#
# Cron (hourly):
#   0 * * * * cd /Users/madvil2/Projects/content-factory && \
#     ./scripts/ralph-next.sh >> .ralphex/cron.log 2>&1

set -euo pipefail

cd "$(dirname "$0")/.."

PLANS_DIR="docs/plans"
EXTRA_ARGS=()

if [[ "${1:-}" == "--serve" ]]; then
	EXTRA_ARGS+=(--serve)
fi

# ralphex auto-moves finished plans into docs/plans/completed/. The next plan to
# run is whatever .md is left at the top level, sorted by name.
NEXT_PLAN="$(find "$PLANS_DIR" -maxdepth 1 -name '*.md' -type f 2>/dev/null | sort | head -1)"

if [[ -z "$NEXT_PLAN" ]]; then
	echo "[$(date -u +%FT%TZ)] No plans pending. All complete."
	exit 0
fi

echo "[$(date -u +%FT%TZ)] Running plan: $NEXT_PLAN"
exec ralphex "${EXTRA_ARGS[@]}" "$NEXT_PLAN"
