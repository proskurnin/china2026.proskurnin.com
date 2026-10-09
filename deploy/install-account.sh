#!/usr/bin/env bash
# Run once as root on the VPS, from this checked-out revision.
set -euo pipefail
owner_email=${1:?Usage: sudo bash deploy/install-account.sh OWNER_EMAIL}
test "$(id -u)" = 0 || { echo 'Run as root on the VPS'; exit 1; }
source_root=$(cd "$(dirname "$0")/.." && pwd)
command -v docker >/dev/null
command -v python3 >/dev/null
command -v apachectl >/dev/null
if docker inspect china-account >/dev/null 2>&1; then
  echo 'china-account already exists. Stop: inspect and back up before upgrading.'
  exit 1
fi
# Locate exactly the existing China HTTPS vhost; never modify Europe.
vhost=$(python3 - <<'PY'
from pathlib import Path
import re
matches=[]
for p in Path('/etc/apache2/sites-enabled').glob('*'):
 for block in re.findall(r'<VirtualHost\b[^>]*>[\s\S]*?</VirtualHost>',p.read_text()):
  if ':443' in block.split('>')[0] and re.search(r'^\s*ServerName\s+china2026\.proskurnin\.com\s*$',block,re.M): matches.append(str(p.resolve()))
if len(matches)!=1: raise SystemExit('Expected one China HTTPS vhost; inspect Apache configuration')
print(matches[0])
PY
)
code=/opt/china-account/releases/$(date -u +%Y%m%dT%H%M%SZ)
install -d -m 755 "$code"
install -m 644 "$source_root"/server/account/{app,core,public-plan,start,owner-invite}.mjs "$code/"
# Plans remain outside the website document root.
install -m 644 "$source_root/data/plan.json" "$code/plan.json"
install -m 644 "$source_root/data/tour.json" "$code/tour.json"
install -d -m 700 -o 1000 -g 1000 /var/lib/china-account
# Reuse the same Node runtime as Europe. Pull only if absent.
docker image inspect node:22-bullseye-slim >/dev/null 2>&1 || docker pull node:22-bullseye-slim
docker run -d --name china-account --restart unless-stopped \
 --user 1000:1000 --read-only --cap-drop ALL --security-opt no-new-privileges \
 --memory 384m --pids-limit 64 --log-opt max-size=10m --log-opt max-file=3 \
 -p 127.0.0.1:3221:3221 -v "$code:/app:ro" -v /var/lib/china-account:/data \
 -e SITE_ORIGIN=https://china2026.proskurnin.com \
 node:22-bullseye-slim node /app/start.mjs >/dev/null
ready=0
for attempt in {1..20}; do
 if curl -fsS http://127.0.0.1:3221/api/account/me | python3 -c 'import sys,json;assert json.load(sys.stdin)=={"user":None}' 2>/dev/null; then ready=1;break;fi
 sleep 1
done
if [ "$ready" != 1 ]; then echo 'Backend did not start; inspect docker logs china-account'; exit 1; fi
backup="$vhost.before-china-account-$(date -u +%Y%m%dT%H%M%SZ)"
cp -p "$vhost" "$backup"
a2enmod proxy proxy_http >/dev/null
python3 - "$vhost" <<'PY'
from pathlib import Path
import sys,re
p=Path(sys.argv[1]);s=p.read_text()
def patch(m):
 block=m.group()
 if ':443' not in block.split('>')[0] or not re.search(r'^\s*ServerName\s+china2026\.proskurnin\.com\s*$',block,re.M): return block
 if '/api/account/' in block: raise SystemExit('Existing account proxy; inspect manually')
 config='''    ProxyPass /api/account/ http://127.0.0.1:3221/api/account/
    ProxyPassReverse /api/account/ http://127.0.0.1:3221/api/account/
    ProxyPass /api/trip/ http://127.0.0.1:3221/api/trip/
    ProxyPassReverse /api/trip/ http://127.0.0.1:3221/api/trip/
'''
 return block.replace('</VirtualHost>',config+'</VirtualHost>')
p.write_text(re.sub(r'<VirtualHost\b[^>]*>[\s\S]*?</VirtualHost>',patch,s))
PY
if ! apachectl configtest || ! systemctl reload apache2; then
 cp -p "$backup" "$vhost"
 apachectl configtest && systemctl reload apache2
 echo 'Apache configuration restored'; exit 1
fi
curl -fsS --resolve china2026.proskurnin.com:443:127.0.0.1 https://china2026.proskurnin.com/api/account/me | python3 -c 'import sys,json;assert json.load(sys.stdin)=={"user":None}'
# Do not put activation tokens into CI logs, Git, or the public website.
umask 077
docker exec china-account node /app/owner-invite.mjs "$owner_email" > /root/china-owner-invite.txt
echo 'Backend ready. Owner activation link saved privately in /root/china-owner-invite.txt (valid 24 hours).'
echo 'Publish feature/china-accounts through the regular main deployment, then open the activation link.'
