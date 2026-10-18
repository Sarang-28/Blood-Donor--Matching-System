# Implementation inventory

The existing React/MUI UI and Express/PostGIS architecture were extended in place.

| Area | Audit findings | Implemented |
|---|---|---|
| Authentication | Shared default secret, non-revoking logout, incomplete registration transaction | Production secret checks, HS256, token versions, password changes, transactional registration, duplicate email/normalized-phone indexes, suspended-account checks |
| Privacy | Unrestricted CORS, donor phone search, unrestricted request details/status, unauthenticated sockets | Origin allowlist, minimal search responses, ownership checks, accepted-match socket authorization, consent-based saved/live location, no persistent profile cache |
| Matching | Fixed radius, repeat alerts, eligibility bypass by manual offer | Shared RBC matrix, configurable radius/interval, PostGIS geography index, consent/availability/age/weight/interval checks, duplicate-safe invitations, request locks |
| Donations | Replay/race risk and incorrect donor updates | Verified responsible hospital, HMAC confirmation codes, attempt limit, atomic partial fulfillment, unique request/donor donation, immutable verified donation-date floor |
| Requests | Missing ownership, expiry, update history | Cancellation/update authorization, required time, expiration job, status trigger, duplicate request guard, hospital assignment |
| Maps | Fabricated Pune coordinates, inconsistent socket URL, broken destination prop | Leaflet map picker and manual coordinates in registration/request/profile forms, browser permission button, bundled marker assets, configurable OSM tiles, directions |
| Portals | Mock patient dashboard, NGO mapped to blood bank | Real patient history/matches/cancel flow, independent NGO profiles/verification/assigned-case summaries, donor history/decline, aggregate admin reports/CSV/audit/settings |
| Landing | Fabricated live records/performance/rarity claims | Database summary/feed, common compatibility rules, removed unsupported rarity/performance claims |
| Notifications | Broken read-all path and response parser, SMS mock PII logging | Fixed in-app UI, consent preferences, provider configuration status, delivery outcomes for match alerts, installed Twilio dependency |
| Database | Missing migration tracking and integrity controls | Ordered transactional migrations with advisory lock, constraints, indexes, query/lock timeouts, TLS verification, runtime privilege script, no default admin seed |

## Implementation order and verification

1. Inspect routes, controllers, schema, frontend calls and configuration.
2. Repair authorization/authentication, privacy and validation.
3. Implement transaction-safe matching, responses, donation completion and migrations.
4. Connect maps and role portals; replace mock operational data.
5. Add admin reports/settings, NGO coordination and notification preferences.
6. Run unit/API/PostGIS concurrency tests, build, lint and dependency audit.

## Requester approval update

- Donor acceptance and manual offers create an in-app notification with a Review donor action for the request creator.
- Review dialog offers Approve & share contact and Reject donor. The consent text identifies the shared fields.
- A pending/rejected donor receives no patient name, phone, saved address or exact coordinates through alerts; general request browsing no longer exposes saved destinations. Old invitation text is redacted by migration 007.
- Approval shares only that request’s patient name, designated contact phone, hospital/destination address and coordinates with the approved donor. It does not share medical history, home address or profile data. The donor portal provides Call and Directions actions.
- Live location sharing and donation completion require requester approval. Closed/expired requests no longer return contact details.
- Request-row locks serialize reviews and approval slots are limited by remaining units. Duplicate reviews cannot repeat approval notifications. Unapproved acceptances can remain pending; they do not reserve units.
- This update adds patient/request-creator review after donor acceptance. Hospital approval before initial matching remains unimplemented.

## Explicit remaining limitations

- This is not a claim that every database protection technique or every optional specification item is implemented. Production infrastructure is not modified by this change.
- Managed encryption at rest, encrypted backups/PITR, restore drills, network firewall/private endpoints, secrets rotation, security monitoring, retention and deletion schedules require hosting/operator configuration.
- Runtime SQL privileges are supplied separately and must be applied using an owner account. Application authorization is not row-level security. RLS is not enabled blindly on the shared backend connection: tested per-user transaction context and policies are required before introducing it. Never expose these tables through a browser database client.
- Notification retries/outbox, delivery webhooks, WhatsApp and email password reset are not implemented. Push requires a deployed Firebase messaging service worker and provider configuration; SMS requires Twilio credentials. No provider delivery has been verified with real credentials.
- JWTs use sessionStorage and remain accessible to JavaScript. This reduces persistence, not XSS risk. An HttpOnly-cookie session design with CSRF protection is a separate upgrade.
- In-memory rate limiting is per process; multi-instance/serverless production needs a shared limiter or gateway protection. Configure TRUST_PROXY only for the actual trusted proxy network.
- Existing donors must explicitly grant location consent and complete age/weight before matching. Old plaintext OTPs are invalidated by migration. Old NGO-as-blood-bank accounts are not automatically reclassified; verify and migrate them deliberately.
- Lost/expired confirmation codes require a future reissue workflow. Accepted codes are shown once and are not retrievable from storage. Do not use the app as the sole emergency coordination channel.
- NGO outreach campaign management, comprehensive medical eligibility questionnaires, institution-document uploads, advanced date/area analytics and pagination across all lists remain future enhancements.
- Browser visual/interaction checks were blocked by disabled local browser access. Build and API tests do not substitute for mobile/accessibility/browser acceptance testing.
