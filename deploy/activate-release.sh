#!/usr/bin/env bash
set -euo pipefail
revision=${1:?Missing revision}
run_id=${2:?Missing run id}
[[ "$revision" =~ ^[a-f0-9]{40}$ ]] || exit 1
[[ "$run_id" =~ ^[0-9]+$ ]] || exit 1
site_root=/var/www/china2026.proskurnin.com
archive="/tmp/china2026-$revision-$run_id.tar.gz"
release="$site_root/releases/$revision-$run_id"
test -s "$archive"
mkdir -p "$site_root/releases"
exec 9> "$site_root/deploy.lock"
flock -w 120 9
test ! -e "$release"
mkdir "$release"
tar -xzf "$archive" -C "$release"
test -s "$release/index.html"
test "$(cat "$release/release.txt")" = "$revision"
previous=$(readlink -f "$site_root/current" || true)
ln -s "$release" "$site_root/current-next"
mv -Tf "$site_root/current-next" "$site_root/current"
if ! actual=$(curl --fail --silent --show-error --max-time 15 \
  -H 'Host: china2026.proskurnin.com' http://127.0.0.1/release.txt) || [ "$actual" != "$revision" ]; then
  if [ -n "$previous" ]; then
    ln -s "$previous" "$site_root/current-rollback"
    mv -Tf "$site_root/current-rollback" "$site_root/current"
  else
    rm "$site_root/current"
  fi
  echo 'Local release verification failed; previous release restored'
  exit 1
fi
rm -f "$archive"
echo "Activated release: $revision"
