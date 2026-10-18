# Setup, deployment and database protection

## Local setup

Use Node 24+, PostgreSQL 16+ and PostGIS. From the repository root:

```powershell
npm ci --ignore-scripts
Copy-Item .env.example .env
Copy-Item backend/.env.example backend/.env
```

Set actual database connection settings and a random JWT_SECRET in backend/.env. Generate a secret with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`. Do not commit it. Set the frontend API URL in .env; VITE values are public.

For a new database run `npm run init-db --workspace backend`. For an existing database run `npm run migrate --workspace backend`. Then run `npm run dev --workspace backend` and `npm run dev` in separate terminals. Schema initialization does not create users.

Migrations fail rather than delete conflicting records. Review duplicate emails/normalized phones and request/donor donations before migration; reconcile them with the data owner. Back up first. Apply migrations once with a dedicated schema owner before rolling out the API.

Create an administrator using `node backend/database/createAdmin.js` with ADMIN_EMAIL, ADMIN_PHONE and a unique ADMIN_PASSWORD supplied in the process environment. Clear the password afterward. Public registration never permits administrator creation. If an old deployment used the former default seed account, rotate its credentials and revoke its sessions immediately.

## Map settings

OSM display needs no API key for modest development usage. Configure VITE_MAP_TILE_URL and attribution for your selected production tile provider and comply with its usage policy. VITE_MAP_LAT/LNG set only the initial viewport, never a stored donor/request location. A selected verified hospital determines the request destination server-side. Donors must opt in to matching location use. Geolocation requires HTTPS except localhost.

Set VITE_ENABLE_LIVE_TRACKING=true and VITE_SOCKET_URL only with a long-running Socket.IO backend. Vercel-only deployments use polling and should leave live tracking disabled. Every socket handshake verifies the JWT and account; room joins/updates check accepted match ownership. Coordinates are broadcast transiently and are not logged or persisted as tracking history. Directions open Google Maps only when clicked.

## Production database checklist

- Use a managed PostGIS-capable database, private connectivity/firewall allowlists, TLS and certificate validation. NODE_ENV=production forces verified database TLS; supply DB_SSL_CA if the provider uses a private CA. URL SSL parameters are stripped to avoid overriding verification.
- Create a separate non-owner `bloodmatch_app` login, then apply `backend/database/runtimePrivileges.sql` as owner. Use that login for the API and a separate owner for migrations. Audit membership to ensure it cannot inherit owner/superuser privileges.
- Runtime access allows necessary SELECT/INSERT/UPDATE, disallows DELETE/TRUNCATE, and does not permit audit-history updates. Revoke anonymous/browser-role table access. Do not grant direct browser access to health/location/account tables.
- Configure managed disk encryption and encrypted backups with separately controlled keys. Enable PITR, off-host backups, retention appropriate to institutional policy, and test restores into an isolated environment. A successful backup job alone is not a restore test.
- Schedule `npm run expire-requests --workspace backend` periodically with server-only database credentials. Request matching/acceptance already reject passed deadlines even if the scheduler is delayed.
- Define retention for requests, location, notifications and audit records before launch. Perform approved deletion through a separate maintenance role; do not give broad deletion privileges to the web runtime.
- Monitor failed sign-ins, unexpected privilege changes, migration failures, notification failures, storage growth and slow queries. Logs must not contain tokens, SQL parameters, medical details or exact coordinates.
- Rotate secrets and database credentials through the host secret store. Use a shared rate limiter at the gateway for multiple API instances. Explicitly configure trusted proxies; never trust all X-Forwarded-For headers.

No production database connection or hosting account was changed or verified during this implementation.

## Vercel / containers

Vercel uses the existing api/index.js entry point. Configure backend variables in the server deployment and VITE_API_URL for the frontend build (same-origin `/api` is supported). CLIENT_URL is a comma-separated exact-origin allowlist. Apply migrations using an owner connection outside the serverless request path. Use provider connection pooling with suitable pool limits. Health is a process liveness check, not a database readiness guarantee.

Dockerfiles use the root workspace lockfile. docker-compose.yml is local development only; set DB_PASSWORD and JWT_SECRET explicitly. Its PostgreSQL port is bound to loopback. Production needs managed TLS and least-privilege credentials rather than that development topology.

## External providers

Twilio: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER. Firebase server: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY. Firebase client: VITE_FIREBASE_* and a messaging service worker configured for your project. Users opt in on Profile. Missing provider configuration is reported as unconfigured; it never means delivered. Provider submission success is not proof of handset delivery.

References: [node-postgres TLS configuration](https://node-postgres.com/features/ssl), [PostgreSQL privileges](https://www.postgresql.org/docs/current/ddl-priv.html), [PostgreSQL row security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html).
