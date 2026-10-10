#!/usr/bin/env bash
# Update the private participant service without changing accounts or invitations.
set -euo pipefail
source_root=$(cd "$(dirname "$0")/.." && pwd)
archive=$(mktemp /tmp/china-packing.XXXXXX)
trap 'rm -f "$archive"' EXIT
tar -czf "$archive" -C "$source_root" server/account/app.mjs data/tour.json
remote_archive="/tmp/china-packing-$(date -u +%Y%m%dT%H%M%SZ).tar.gz"
scp "$archive" "root@80.87.199.223:$remote_archive"
ssh root@80.87.199.223 bash -s -- "$remote_archive" <<'REMOTE'
set -euo pipefail
archive=$1
code=$(docker inspect china-account --format '{{range .Mounts}}{{if eq .Destination "/app"}}{{.Source}}{{end}}{{end}}')
[[ "$code" == /opt/china-account/releases/* ]]
backup="$code/backup-packing-$(date -u +%Y%m%dT%H%M%SZ)"
install -d -m 700 "$backup"
cp -p "$code/app.mjs" "$code/tour.json" "$backup/"
docker exec china-account node --input-type=module -e 'import {DatabaseSync,backup} from "node:sqlite"; const db=new DatabaseSync("/data/china.sqlite"); await backup(db,"/data/before-packing-"+Date.now()+".sqlite"); db.close();'
work=$(mktemp -d /tmp/china-packing-install.XXXXXX)
trap 'rm -rf "$work"; rm -f "$archive"' EXIT
tar -xzf "$archive" -C "$work"
install -m 644 "$work/server/account/app.mjs" "$code/app.mjs"
install -m 644 "$work/data/tour.json" "$code/tour.json"
docker restart china-account >/dev/null
ready=0
for attempt in {1..20}; do
 if curl -fsS http://127.0.0.1:3221/api/account/me | python3 -c 'import json,sys;assert json.load(sys.stdin)=={"user":None}' 2>/dev/null; then ready=1; break; fi
 sleep 1
done
if [ "$ready" != 1 ]; then
 cp -p "$backup/app.mjs" "$backup/tour.json" "$code/"
 docker restart china-account >/dev/null
 echo 'Service update failed; previous code restored.' >&2
 exit 1
fi
status=$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3221/api/trip/tour)
test "$status" = 401
echo 'Private packing list updated; guest access remains blocked.'
REMOTE
