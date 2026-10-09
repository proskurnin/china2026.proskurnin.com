#!/usr/bin/env bash
set -euo pipefail
# Run on the server from an existing China Git checkout. Never deploy Europe.
source_dir=$(git rev-parse --show-toplevel)
cd "$source_dir"
test -z "$(git status --porcelain)" || { echo 'Working tree is not clean'; exit 1; }
git pull --ff-only
npm ci
npm run build
test -s dist/client/index.html
site_root=/var/www/china2026.proskurnin.com
release="$site_root/releases/$(date -u +%Y%m%dT%H%M%SZ)-$(git rev-parse --short HEAD)"
mkdir -p "$release"
cp -a dist/client/. "$release/"
test -s "$release/index.html"
ln -s "$release" "$site_root/current-next"
mv -Tf "$site_root/current-next" "$site_root/current"
echo "Published: $release"
