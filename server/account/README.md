# China account service

Adapted from the Europe site's account service. Independent SQLite database,
host-only cookie and owner invitations; Europe accounts are not copied.

- Guests and viewers: public itinerary and map.
- Owner and participants: budget and preparation fetched from `/api/trip/tour`.
- Owner: invite participants/viewers, reset passwords, revoke access.
- Passwords: salted scrypt; sessions: hashed random tokens, seven days,
  Secure/HttpOnly/SameSite=Lax host-only cookies.
- Invitations: single-use, expire after 24 hours; exact-origin validation,
  request-size and password-attempt limits.
- Existing local browser plan backups are unchanged; this change does not migrate
  local edits into accounts. The server storage API is inherited from Europe.

## Initial production installation

Requires root on the existing VPS, Docker and Apache. The installer only changes
China's HTTPS virtual host. It preserves Europe and fails if China already has a
container, to prevent an accidental database replacement.

From a checkout of the reviewed `feature/china-accounts` revision on the VPS:

```sh
sudo bash deploy/install-account.sh YOUR_OWNER_EMAIL
```

Service: `china-account`, loopback `127.0.0.1:3221`. Code and private plans:
`/opt/china-account/releases/`. Persistent database: `/var/lib/china-account/`.
The owner activation URL is saved mode 600 in `/root/china-owner-invite.txt`;
read it privately and never paste it into GitHub/CI logs. No default password.

After the backend is healthy, merge the branch into main: the existing deployment
publishes the frontend. Its preflight refuses deployment without a working
account API. Open the owner activation URL and set your password. To regenerate
an expired invitation, run the following privately on the VPS:

```sh
sudo docker exec china-account node /app/owner-invite.mjs YOUR_OWNER_EMAIL
```

Backend upgrades require a reviewed new code release, SQLite backup using its
backup API, and container recreation using the same `/var/lib/china-account`
volume. Frontend Actions do not update backend code or touch the database.

## Validation

```sh
npm run test:auth
npx tsc --noEmit
npm run build
```

Build strips prices/questions from the frontend tour payload and writes the
Apache directory entry point `/account/index.html`. Static hosting alone cannot
provide authentication. Historical public tour prices in Git/PDFs cannot be made
secret retroactively.
