#!/usr/bin/env bash
# Run from a machine with GitHub access; inputs are paths, never paste key contents.
set -euo pipefail
key_file=${1:?Path to the SSH private key authorized on the server}
hosts_file=${2:?Path to verified SSH known_hosts entries for the server}
test -s "$key_file"
test -s "$hosts_file"
repo=proskurnin/china2026.proskurnin.com
gh secret set DEPLOY_SSH_KEY --repo "$repo" < "$key_file"
gh secret set DEPLOY_KNOWN_HOSTS --repo "$repo" < "$hosts_file"
gh variable set DEPLOY_HOST --repo "$repo" --body '80.87.199.223'
gh variable set DEPLOY_USER --repo "$repo" --body 'china2026-deploy'
gh variable set DEPLOY_PORT --repo "$repo" --body '22'
echo 'Actions deployment credentials configured'
