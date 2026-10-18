# Tests and demonstration

## Automated checks

```powershell
npm ci --ignore-scripts
npm test
npm run build
npm run lint
npm audit
```

Integration tests use real PostgreSQL/PostGIS. **They truncate application records. Use only a dedicated disposable database ending in `_test`.** Example local setup:

```powershell
docker run --name bloodmatch-security-test -e POSTGRES_PASSWORD=test-only-local -e POSTGRES_DB=bloodmatch_test -p 127.0.0.1:55432:5432 -d postgis/postgis:16-3.4
$env:TEST_DATABASE_URL='postgresql://postgres:test-only-local@127.0.0.1:55432/bloodmatch_test'
node --test backend/test/security.test.js backend/test/integration.test.js
```

Tests cover all 64 RBC combinations, invalid coordinates/password byte limits, unauthorized origins/roles, registration, verification, spatial and donation interval exclusion, private request access, duplicate requests/invitations, concurrent acceptance, socket authorization, concurrent donation replay, partial fulfillment, cancellation history, verified donor-date integrity, settings permissions, NGO assignment, expiry, suspension, logout and password-change revocation.

The integration suite constructs synthetic users; it never uses real patient records. Build, lint and dependency audit are separate checks. Browser visual/interaction verification was unavailable because local browser use is disabled. Review forms/maps, keyboard navigation and mobile layout manually before deployment. External SMS/push delivery is not tested without provider credentials.

## Recorded results (17 October 2026)

- Node/PostGIS suite: 27 tests passed, 0 failed.
- Production frontend build: passed.
- ESLint: 0 errors, 26 warnings (hooks/unused code).
- npm dependency audit: 0 known vulnerabilities after dependency updates.
- Database migrations applied and repeat-run migration tracking checked on isolated PostgreSQL 16/PostGIS.
- Browser checks and real notification deliveries: not verified.

## Demonstration workflow

1. Initialize a disposable development database and provision a unique admin through createAdmin.js.
2. Register a hospital and NGO with synthetic organization details and map positions; approve both from Admin → verification queue.
3. Register an eligible O− donor with age/weight and matching consent near that hospital. Leave external alert consent off unless test provider credentials are configured.
4. Register a patient, create a request, choose the verified hospital, set units and deadline. Inspect the patient dashboard and matches.
5. As the donor, accept the invitation and save the one-time confirmation code. On a long-running server, explicitly start/stop location sharing to exercise tracking.
6. As the patient, use Review donor in the notification menu or View matches, then Approve & share contact. The donor sees the phone and destination after approval (portal refreshes every 15 seconds). Pending and rejected donors cannot access those fields. As the assigned hospital, open the request and record a donation using the code. For a two-unit request, a one-unit donation leaves partial fulfillment; a second eligible donor completes it. Reusing a code must fail.
7. Assign a verified NGO from the request detail dialog. Its dashboard shows only assigned-case summaries.
8. Cancel another request; inspect notifications and history. Change a password or suspend an account and confirm old tokens fail.
9. Inspect Admin reports, CSV export and matching settings. Do not interpret preliminary matching as clinical approval.

Production backups/restores, runtime privileges, hosting TLS and notification-provider delivery require separate deployment acceptance checks.

Approval regression tests cover hidden details before consent, unauthorized reviews, blocked tracking/donation before approval, duplicate reviews, donor notification, contact sharing only to the selected donor, two donors competing for one remaining slot, rejection, and cancellation hiding details.
