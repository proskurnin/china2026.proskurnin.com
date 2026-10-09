#!/usr/bin/env bash
# Run manually in the owner's Terminal; no passwords or activation tokens are stored here.
set -euo pipefail
source_root=$(cd "$(dirname "$0")/.." && pwd)
archive=$(mktemp /tmp/china-account.XXXXXX)
trap 'rm -f "$archive"' EXIT
tar -czf "$archive" -C "$source_root" server/account data/plan.json data/tour.json deploy/install-account.sh
remote_archive="/root/china-account-$(date -u +%Y%m%dT%H%M%SZ).tar.gz"
scp "$archive" "root@80.87.199.223:$remote_archive"
ssh -t root@80.87.199.223 "bash -c 'set -euo pipefail; work=\$(mktemp -d /root/china-account-install.XXXXXX); tar -xzf $remote_archive -C \"\$work\"; printf \"Email владельца сайта: \"; read -r owner_email; bash \"\$work/deploy/install-account.sh\" \"\$owner_email\"; rm -f $remote_archive'"
