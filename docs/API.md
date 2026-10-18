# API reference

All paths below begin with `/api`. JSON success: `{success:true,message,data}`. Errors: `{success:false,message,error,details?}`. Common errors: 400 invalid input, 401 missing/expired/revoked authentication, 403 forbidden role/ownership, 404 unavailable record, 409 conflict/closed state/duplicate, 429 rate limit, 500 generic internal failure. Protected operations use `Authorization: Bearer <token>`; every request verifies active account and token version. Never send secrets in URLs.

## Authentication and accounts

| Method/path | Access | Inputs and result / database effects |
|---|---|---|
| POST /auth/register | Public, rate-limited | email, phone (8–15 digits), password (new account: 12 characters, max 72 UTF-8 bytes), role; latitude/longitude; name/address and role fields. Donor requires bloodGroup, age 18–65, weightKg >=45; locationConsent enables matching. Hospital requires hospitalRegistrationNumber. NGO/bank requires registration/license number. Atomically inserts account/profile; returns token, user, profile, available roles. Existing-role addition requires password or valid same-account token. |
| POST /auth/login | Public, rate-limited | email/username and password; returns token/user/profile. |
| POST /auth/admin-login or /auth/admin/login | Public, rate-limited | Exact admin email and password; server checks admin role and active state. |
| GET /auth/me | Authenticated | Own user and role profiles; no password hash. |
| POST /auth/logout | Authenticated | Increments token version; invalidates all account sessions. |
| POST /auth/change-password | Authenticated, rate-limited | currentPassword,newPassword; checks current hash, updates hash and revokes all sessions. |
| PUT /auth/fcm-token | Authenticated | fcmToken; updates own device token. |
| GET /account/preferences | Authenticated | Own SMS/push consent and configured provider flags. |
| PUT /account/preferences | Authenticated | Boolean smsConsent,pushConsent; updates own preferences. |

## Profiles and directories

| Method/path | Access | Inputs/result |
|---|---|---|
| GET /donors or /donors/nearby | Authenticated | lat,lng,radiusKm (1–100), bloodGroup,search; bounded directory without phones or exact coordinates. Spatial search uses compatible recipient group. |
| GET /donors/:id | Authenticated | Limited donor profile; no exact coordinates or phone. |
| GET /donors/profile | Donor | Own full profile, eligibility interval result and next eligible date. |
| PUT /donors/profile | Donor | fullName,bloodGroup,age,weightKg,locationName,latitude/longitude,lastDonationDate,emergencyReady,locationConsent; updates own profile. Verified donation history cannot be backdated. |
| PATCH /donors/availability | Donor | status: Available, Unavailable, Temporarily Unavailable; omitted status toggles availability. |
| GET /donors/history | Donor | Own verified donation records. |
| GET /hospitals and /hospitals/:id | Public | Verified institutional directory/details. |
| GET /hospitals/profile | Hospital | Own profile including verification state and coordinates. |
| PUT /hospitals/profile | Hospital | hospitalName,address,emergencyContact,speciality,latitude/longitude. Address/location changes require reverification. |
| GET/PUT /patients/profile | Patient | Own profile; fullName,bloodGroup,medicalCondition,attendingDoctor,address,emergencyContact,latitude/longitude on update. |
| GET /blood-banks | Public | Verified institution directory. |
| GET /blood-banks/:id/inventory | Public | Blood-group stock, no donor data. |
| GET/PUT /blood-banks/profile/me | Blood bank | Own institution profile; name/director/contact/hours/address/coordinates. |
| GET /blood-banks/inventory/me | Blood bank | Own stock. |
| PUT /blood-banks/inventory/me | Blood bank | bloodGroup,unitsAvailable; upserts stock count. |
| GET /ngos | Public | Verified NGO ID, name and service area. |
| GET/PUT /ngos/profile | NGO | Own profile; ngoName,address,serviceArea,coordinatorName on update. |
| GET /ngos/assignments | Verified NGO | Assigned requests and aggregate responses; no patient/donor contacts. |

## Request lifecycle and matches

| Method/path | Access | Inputs/result/effects |
|---|---|---|
| POST /blood-requests | Authenticated supported role | patientName,hospitalName,bloodGroup,unitsRequired (1–100),locationName,latitude,longitude; optional hospitalId,urgency,requiredBefore,contactPhone,notes,role. Institution profiles must satisfy verification rules. Verified selected hospital determines coordinates/name. Creates request and matches; default deadline 24h. Similar recent active requests rejected. |
| GET /blood-requests | Authenticated | bloodGroup,urgency,search,status filters; up to 50 summaries without patient/contact/notes. |
| GET /blood-requests/my | Authenticated | Own requests and requests assigned to own verified hospital, with counts. |
| GET /blood-requests/:id | Owner, assigned hospital, admin | Private request and matches. Donor phone only after acceptance/completion. |
| PATCH /blood-requests/:id | Owner | urgency,unitsRequired,requiredBefore; open requests only, counts cannot drop below fulfilled units; audit logged. |
| PATCH /blood-requests/:id/status | Owner/admin | status=cancelled only; atomically closes open request, expires matches and adds notifications/history. |
| POST /blood-requests/:id/assign-ngo | Owner/admin | ngoId; must be verified; idempotency conflict prevents duplicate assignment. |
| GET /matches/my-alerts | Donor | Own invitation/response history and requesterDecision. contactDetails is null unless this donor is accepted, approved, and the request remains open and unexpired. |
| PATCH /matches/:matchId/review | Request creator only | decision=approved/rejected; accepted pending donors only. Locks the request, limits approvals to remaining units, records decision/audit and notifies donor. Approval consents to sharing patient name, request contact phone and saved destination. |
| PATCH /matches/:matchId/respond | Matched donor | response=accepted/declined. Locks request and invitation, checks eligibility; one response wins. Accepted response includes one-time otpCode; contact details remain hidden pending requester approval. |
| POST /matches/manual-offer | Donor | requestId; validates eligibility, radius and lifecycle, records accepted match, returns one-time otpCode. |
| POST /matches/:requestId/trigger | Owning hospital/admin | optional radiusKm; reruns matching without repeating invitations. |
| POST /matches/record-donation | Responsible verified hospital | bloodRequestId,otpCode,unitsDonated, optional donorId,notes. Locks request/match/donor, requires requester approval, validates hashed code and attempt limit, records donation, updates interval and units, marks fulfilled at required count. |

## Notifications, reporting and operations

| Method/path | Access | Inputs/result/effects |
|---|---|---|
| GET /notifications | Authenticated | Own latest 50 notifications plus total unreadCount. |
| PATCH /notifications/:id/read | Recipient | Marks own notification read. |
| PATCH /notifications/read-all | Authenticated | Marks own unread notifications read. |
| GET /admin/stats | Admin | Database counts, verification queue, recent activity. |
| GET /admin/users | Admin | role,search,page,limit (<=100). |
| PATCH or POST /admin/users/:id/status | Admin | isActive boolean; self-suspension rejected, token version incremented, audit added. |
| PATCH or POST /admin/verifications/:type/:id | Admin | type hospital/blood_bank/ngo; action verified/rejected,remarks; transactional verification/audit, notification. |
| GET /admin/requests/critical | Admin | Urgent/critical unresolved requests. |
| GET /admin/audit-logs | Admin | Latest 100 audit entries. |
| GET /admin/reports | Admin | Aggregate request/match/provider outcomes. format=csv exports request aggregates and logs export. |
| GET /settings | Public | Matching radius/interval only. |
| PUT /settings | Admin | radiusKm 1–100, cooldownDays 1–365; saves and audits policy. |
| GET /public/summary | Public | Aggregate donor/request counts, verified hospital request feed, matching settings; no personal data. |
| GET /health | Public | Process liveness, not database readiness. |

Socket.IO is separate from the HTTP API. Handshake `auth.token`; `join_tracking_room` with matchId returns acknowledgement success; `location_update` requires accepted donor ownership and valid coordinates and is throttled; `leave_tracking_room` stops room membership. Recipients are authorized again for each broadcast. Provider callbacks, WhatsApp and password-reset endpoints are not supplied.

Requester approval is a separate consent step after donor acceptance. It does not implement hospital approval of newly created blood requests. Hospital-created requests use the hospital account as requester. Rejected decisions cannot be silently changed. One approved donor reserves one remaining unit; recording multiple units cannot consume another donor’s reservation.
