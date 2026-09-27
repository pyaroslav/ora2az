#!/usr/bin/env bash
# Day-0 bring-up after the Sanity org/project exist. Idempotent. Reads ~/.config/ora2az/env.
#   scripts/bringup.sh schema   # deploy schema from studio/ (needs `npx sanity login` once)
#   scripts/bringup.sh seed     # validate + upsert content/data/*.yaml
#   scripts/bringup.sh check    # public dataset query + counts
#   scripts/bringup.sh ask      # first live agent call through the GROQ endpoint
#   scripts/bringup.sh all
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENVF="$HOME/.config/ora2az/env"
[ -f "$ENVF" ] || { echo "missing $ENVF"; exit 1; }
set -a; . "$ENVF"; set +a
need() { for v in "$@"; do [ -n "${!v:-}" ] || { echo "env $v is empty in $ENVF"; exit 1; }; done; }

schema() {
  need SANITY_PROJECT_ID
  cd "$ROOT/studio"
  SANITY_STUDIO_PROJECT_ID="$SANITY_PROJECT_ID" SANITY_STUDIO_DATASET="${SANITY_DATASET:-production}" npx sanity schema deploy
}
seed() {
  need SANITY_PROJECT_ID SANITY_WRITE_TOKEN
  cd "$ROOT/content" && node validate.mjs && node seed.mjs
}
check() {
  need SANITY_PROJECT_ID
  local q='{"features":count(*[_type=="oracleFeature"]),"mappings":count(*[_type=="mapping"]),"caveats":count(*[_type=="caveat"]),"disputes":count(*[_type=="dispute"]),"patterns":count(*[_type=="pattern"]),"sources":count(*[_type=="source"])}'
  curl -sS "https://${SANITY_PROJECT_ID}.api.sanity.io/v2026-09-01/data/query/${SANITY_DATASET:-production}?query=$(python3 -c 'import sys,urllib.parse;print(urllib.parse.quote(sys.argv[1]))' "$q")" | python3 -m json.tool
}
ask() {
  need SANITY_ORG_ID SANITY_ORG_TOKEN
  cd "$ROOT/agent" && ./bin/ora2az ask "We are on Oracle 19c and use DBMS_JOB for nightly batches. Moving to Azure SQL Managed Instance — what happens to those jobs?" --mcp groq --max-turns 12
}
case "${1:-all}" in
  schema) schema ;; seed) seed ;; check) check ;; ask) ask ;;
  all) schema; seed; check; ask ;;
  *) echo "usage: $0 {schema|seed|check|ask|all}"; exit 2 ;;
esac
