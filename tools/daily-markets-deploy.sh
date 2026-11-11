#!/usr/bin/env bash
# Daily Markets refresh + production deploy for the AI Situation Room (static site on Vercel).
#
#   1. python3 tools/refresh-markets.py        -> rewrites data/markets.js (Yahoo Finance, keyless, delayed)
#   2. python3 tools/build-manifest.py         -> SHA1/size/base64 manifest of the deployable files (no tools/, shots/)
#   3. Vercel REST API (same calls the deploy uses now): upload each file (POST /v2/files),
#      then create a deployment with target=production (POST /v13/deployments) and wait for READY
#   4. curl the live /data/markets.js and check its "asOf" equals the freshly generated one
#
# Usage:
#   VERCEL_TOKEN=... tools/daily-markets-deploy.sh            # refresh + deploy to production + verify
#   tools/daily-markets-deploy.sh --no-deploy                 # refresh + manifest only (no token needed)
#   tools/daily-markets-deploy.sh --verify-only               # just compare live asOf with local data/markets.js
# Env:
#   VERCEL_TOKEN      required for deploy (create at vercel.com/account/tokens; never commit it)
#   VERCEL_TEAM_ID    optional team scope (team_...)
#   VERCEL_PROJECT    optional, default prj_Yhx9RNkf71JkUZqrtq1zxP5BIM8A
#   SITE_URL          optional, default https://ai-situation-room.vercel.app
# Cron example (weekdays 5:30 PM New York time, after the US close):
#   CRON_TZ=America/New_York
#   30 17 * * 1-5  cd /path/to/site && VERCEL_TOKEN=... tools/daily-markets-deploy.sh >> /tmp/asr-daily.log 2>&1
# Exit codes: 0 ok, 1 refresh/manifest failed, 2 deploy failed, 3 live verification failed.
set -euo pipefail
cd "$(dirname "$0")/.."
MODE="${1:-deploy}"
PROJECT="${VERCEL_PROJECT:-prj_Yhx9RNkf71JkUZqrtq1zxP5BIM8A}"
SITE="${SITE_URL:-https://ai-situation-room.vercel.app}"
OUT="${ASR_UPLOAD_DIR:-/tmp/asr-upload}"
API="https://api.vercel.com"
Q=""; [ -n "${VERCEL_TEAM_ID:-}" ] && Q="teamId=${VERCEL_TEAM_ID}"
log(){ echo "[$(date '+%Y-%m-%d %H:%M:%S %Z')] $*"; }
asof(){ python3 -c 'import re,sys; m=re.search(r"\"asOf\":\s*\"([^\"]+)\"", sys.stdin.read()); print(m.group(1) if m else "")'; }

verify(){
  local want got code
  want=$(asof < data/markets.js)
  for i in 1 2 3 4 5 6; do
    code=$(curl -s -o /tmp/asr-live-markets.js -w '%{http_code}' -H 'Cache-Control: no-cache' "$SITE/data/markets.js?ts=$(date +%s)")
    got=$(asof < /tmp/asr-live-markets.js || true)
    [ "$code" = 200 ] && [ "$got" = "$want" ] && { log "VERIFIED live $SITE/data/markets.js 200, asOf=$got"; return 0; }
    sleep 10
  done
  log "VERIFY FAILED: http=$code live asOf='$got' expected '$want'"; return 3
}

if [ "$MODE" = "--verify-only" ]; then verify; exit $?; fi

log "Refreshing market data"
python3 tools/refresh-markets.py || { log "refresh failed"; exit 1; }
log "Local asOf: $(asof < data/markets.js)"
python3 tools/build-manifest.py --src . --out "$OUT" >/dev/null || { log "manifest failed"; exit 1; }
log "Manifest: $OUT/manifest.json ($(python3 -c "import json;print(len(json.load(open('$OUT/manifest.json'))))" ) files)"
[ "$MODE" = "--no-deploy" ] && { log "--no-deploy: stopping before upload"; exit 0; }
: "${VERCEL_TOKEN:?VERCEL_TOKEN is not set (needed to deploy)}"

log "Uploading files"
python3 - "$OUT/manifest.json" <<'PY' || exit 2
import json, sys, os, base64, urllib.request
api, q, tok = "https://api.vercel.com", os.environ.get("VERCEL_TEAM_ID"), os.environ["VERCEL_TOKEN"]
for f in json.load(open(sys.argv[1])):
    body = base64.b64decode(open(f["b64"]).read())
    req = urllib.request.Request(api + "/v2/files" + (f"?teamId={q}" if q else ""), data=body, method="POST",
        headers={"Authorization": f"Bearer {tok}", "Content-Type": "application/octet-stream", "x-vercel-digest": f["sha"], "Content-Length": str(len(body))})
    urllib.request.urlopen(req, timeout=60).read()
print("uploaded", f"{len(json.load(open(sys.argv[1])))} files")
PY

log "Creating production deployment"
DEP=$(python3 - "$OUT/manifest.json" "$PROJECT" <<'PY'
import json, sys, os, urllib.request
api, q, tok = "https://api.vercel.com", os.environ.get("VERCEL_TEAM_ID"), os.environ["VERCEL_TOKEN"]
files = [{"file": f["file"], "sha": f["sha"], "size": f["size"]} for f in json.load(open(sys.argv[1]))]
body = {"name": "ai-situation-room", "project": sys.argv[2], "target": "production", "files": files, "meta": {"trigger": "daily-markets-deploy"},
        "projectSettings": {"framework": None, "buildCommand": None, "installCommand": None, "outputDirectory": None}}
qs = "forceNew=1&skipAutoDetectionConfirmation=1" + (f"&teamId={q}" if q else "")
req = urllib.request.Request(f"{api}/v13/deployments?{qs}", data=json.dumps(body).encode(), method="POST",
    headers={"Authorization": f"Bearer {tok}", "Content-Type": "application/json"})
d = json.load(urllib.request.urlopen(req, timeout=60)); print(d["id"])
PY
) || { log "deployment create failed"; exit 2; }
log "Deployment $DEP created; waiting for READY"
for i in $(seq 1 60); do
  S=$(curl -s -H "Authorization: Bearer $VERCEL_TOKEN" "$API/v13/deployments/$DEP${Q:+?$Q}" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("readyState",""))')
  [ "$S" = READY ] && break
  [ "$S" = ERROR ] || [ "$S" = CANCELED ] && { log "deployment $DEP $S"; exit 2; }
  sleep 5
done
[ "$S" = READY ] || { log "deployment $DEP not READY (state=$S)"; exit 2; }
log "Deployment $DEP READY"
verify; rc=$?
echo "DEPLOYMENT_ID=$DEP"
exit $rc
