#!/usr/bin/env bash
# Photos that are not stored in Git (third-party licences); fetched before every CI build.
set -euo pipefail
mkdir -p public/images/power
curl --fail --location --silent --show-error --retry 2 --max-time 30 'https://upload.wikimedia.org/wikipedia/commons/c/c6/Chinasocket.jpg' -o public/images/power/china-socket.jpg
curl --fail --location --silent --show-error --retry 2 --max-time 30 'https://wazza.com.ua/17463-thickbox_default/perehodnik-vilki-eu-us-uk-au-cn-na-tip-i-13a.jpg' -o public/images/power/china-adapter.jpg
file public/images/power/*.jpg
