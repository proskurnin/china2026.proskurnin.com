#!/usr/bin/env bash
# One-time provisioning on the same Apache server as Europe.
set -euo pipefail
tls_email=${1:?Pass the email for Lets Encrypt notifications}
test "$(id -u)" = 0 || { echo 'Run as root on the server'; exit 1; }
command -v apachectl >/dev/null
command -v certbot >/dev/null
command -v flock >/dev/null
mkdir -p /var/www/china2026.proskurnin.com/releases
mkdir -p /var/www/letsencrypt/.well-known/acme-challenge
config=/etc/apache2/sites-available/china2026.proskurnin.com.conf
if [ ! -f "$config" ]; then
  install -m 644 "$(dirname "$0")/china2026.proskurnin.com.conf" "$config"
fi
a2ensite china2026.proskurnin.com.conf
apachectl configtest
systemctl reload apache2
# Uses the new domain only; existing Europe's virtual host is not changed.
certbot --apache --non-interactive --agree-tos --no-redirect \
  --email "$tls_email" -d china2026.proskurnin.com
apachectl configtest
systemctl reload apache2
echo 'China domain provisioned; run the GitHub release workflow next'
