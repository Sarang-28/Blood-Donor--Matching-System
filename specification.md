Hyperlocal Emergency Blood Donor Matching System — Complete Specification

BloodMatch
Hyperlocal Emergency Blood Donor Matching Platform


The system connects patients and hospitals requiring blood with compatible, eligible, nearby donors, while enabling NGOs and administrators to coordinate and oversee emergency requests.
1. Existing project foundation
These are the features and technical elements established in our project work so far.
Component	Current status
React + Vite frontend	Created
Material UI and Framer Motion	Installed/used for interface design and animations
Login and registration pages	Created; authentication must be verified against the backend
Role selection	Donor, Hospital, Patient and NGO
Role-specific dashboards	Created with sample statistics
Blood Requests page	Created with sample requests
Donors page	Created with sample donor records
Profile page	Created with role-specific UI
Separate Admin Login	Created with a distinct admin interface
Admin Dashboard	Created with summary cards and management placeholders
Express backend	Implemented with modular route files
PostgreSQL + PostGIS	Intended database and geospatial matching technology
Vercel deployment	Root endpoint, /api and /api/health verified working
Actual donor API	Not yet verified; direct GET /api/donors returned a route-not-found response
Important: A page being present does not mean its functionality is connected to a database. Claude should inspect the actual repository and preserve working code instead of assuming everything is complete or rebuilding it unnecessarily.
2. Complete functional features
A. Public landing page









1. Professional BloodMatch homepage
- Brand identity, navigation and responsive layout.
- Emergency SOS and Request Blood Urgently buttons.
- Register as Donor and Sign In actions.
- Compatibility Engine section.
- How It Works workflow.
- Tailored Portals for each role.
- Live Blood Requests section.
- Impact statistics and call-to-action sections.
- Smooth scrolling and subtle animations.












2. Interactive blood compatibility engine
- Blood group selection: O−, O+, A−, A+, B−, B+, AB−, AB+.
- Display compatible red blood cell donors and recipients.
- Explain universal donor/recipient concepts accurately.
- Display blood-group rarity information only when supported by reliable data.
- Allow users to proceed to a matching request.
- Ensure the compatibility rules are validated and reused by the backend.



B. Authentication and account management
- Registration and login for Donor, Hospital, Patient and NGO.
- Separate Admin login.
- Password hashing using bcrypt or an equivalent secure password-hashing library.
- JWT access-token authentication.
- Role-based authorization on backend endpoints.
- Input validation and duplicate-email/phone checks.
- Logout and protected pages.
- Profile viewing and editing.
- Password-change functionality and secure password reset, if included in scope.
- Clear error messages for invalid credentials and expired sessions.
Critical rule: Admin privileges must be assigned securely on the server. Public registration must never allow someone to create an administrator account by choosing a role or modifying a request.
C. Donor portal
Donor dashboard and services
- Personal dashboard showing nearby requests, donation history and eligibility information.
- Donor profile containing blood group, contact details, location and last donation date.
- Availability toggle: Available, Unavailable or Temporarily Unavailable.
- Nearby compatible emergency requests, sorted by urgency and distance.
- Accept or decline a donation invitation.
- View hospital location and request details after appropriate authorization.
- Donation history and verified donation records.
- Eligibility checks based on last donation date and configurable medical eligibility rules.
- Notifications for new nearby requests, responses and request cancellations.

D. Patient portal
- Submit an emergency blood request.
- Specify blood group, units required, hospital, location, urgency and required time.
- Provide a safe emergency contact method.
- Track request status in real time or through periodic refresh.
- View the number of compatible donors identified and responses received.
- View confirmed matches and authorized contact details.
- Cancel or update a request when permitted.
- Receive notifications when a donor accepts, the hospital confirms a match or the request is fulfilled.
- View previous requests and their outcomes.
E. Hospital portal
- Hospital registration and verification status.
- Hospital profile with address, contact information and registration number.
- Create blood requests on behalf of patients or the hospital.
- Manage multiple requests and required blood units.
- Search for compatible, eligible donors near the hospital.
- View matching status, approximate distance and donor availability.
- Send invitations to matched donors.
- Track accepted, declined, pending and expired invitations.
- Update request priority and status with an audit trail.
- Confirm donation completion through an authorized verification process.
- View request history and operational statistics.
F. NGO portal
- NGO registration and verification.
- NGO profile and service area.
- View and coordinate eligible emergency requests.
- Help hospitals and patients identify potential donors.
- Coordinate donor outreach and emergency campaigns.
- Track assigned requests, donor responses and completed cases.
- View activity summaries and coordination history.
- Access only the information necessary for their authorized tasks.
G. Admin portal
System management
- Overview of registered users, donors, hospitals, NGOs and active requests.
- User search, filters, role/status views and account suspension.
- Verify or reject hospital and NGO registrations.
- Review donor and account verification status.
- View urgent and unresolved blood requests.
- Investigate duplicate, fraudulent or inappropriate requests.
- Monitor matching outcomes, notifications and system errors.
- View audit logs of important administrative actions.
- Manage configurable system settings, such as the default search radius.
- Generate operational reports and export permitted data.
Security requirement: Admin routes and operations must be protected by backend authorization, not merely hidden in the frontend.

H. Emergency blood request management
Every request should have a defined lifecycle.
Request created
Blood group, units, hospital and location

Compatibility and eligibility checks
Blood type, donor status, location and eligibility

Donors notified
Responses tracked individually

Matched and coordinated
Hospital and authorized users coordinate next steps

Fulfilled, cancelled or expired
Final outcome recorded with authorized confirmation


Required safeguards:
- Urgency levels: Normal, Urgent and Critical.
- Request creation and update timestamps.
- Request expiration and cancellation.
- Unit counts and partial fulfillment tracking.
- Duplicate-request checks.
- Donor response status.
- Request status history.
- Protection against multiple users incorrectly claiming the same donation.
- Critical cases should clearly direct users to contact a hospital or emergency service; the application must not delay medical treatment.
I. Donor matching engine
This is the core technical module of the project.
The matching process should:
1. Retrieve the blood request and validate its required information.
2. Identify compatible donor blood groups using validated red blood cell compatibility rules.
3. Exclude donors who are inactive, unavailable, unverified where verification is required, or otherwise ineligible under configured rules.
4. Exclude donors who fail the configured donation-eligibility checks.
5. Use PostgreSQL and PostGIS to find candidates within a configurable radius, such as the demonstrated 10 km.
6. Calculate or retrieve donor-to-request distances.
7. Rank candidates using compatibility, eligibility, availability, distance and urgency-aware rules.
8. Return only the information the requesting user is authorized to see.
9. Create match records and notify eligible candidates.
10. Record acceptances, declines, timeouts and completed outcomes.
Technical expectations
- Use PostGIS spatial indexes and suitable geographic distance queries.
- Do not calculate geographic distance from a simple string comparison of addresses.
- Avoid sending the same invitation repeatedly to the same donor for the same request.
- Make radius and ranking parameters configurable.
- Ensure matching is performed by the backend, not trusted to client-side React code.
- Do not promise sub-second matching until performance has been measured.
- Blood compatibility is a preliminary filter, not medical authorization for transfusion. Final donor eligibility and compatibility must be determined by qualified medical professionals and the relevant clinical testing.
J. Location and mapping
- Capture donor location with appropriate permission and consent.
- Store geographic coordinates in a PostGIS-compatible format.
- Store hospital/request coordinates.
- Find nearby candidates within a specified radius.
- Support configurable search radius.
- Display approximate distance and, where configured, map markers.
- Provide directions through a supported map service.
- Allow donors to update their location.
- Protect exact donor coordinates and expose only the location detail needed for coordination.
Google Maps or OpenStreetMap can be used for map display. Actual geospatial filtering should be handled by the backend using PostGIS.
K. Notifications
The intended notification layer includes:
- In-app notifications.
- Firebase Cloud Messaging push notifications.
- Twilio SMS notifications.
- Optional WhatsApp messaging only if an approved provider and credentials are configured.
- New emergency request alerts.
- Donor acceptance/decline notifications.
- Request status updates.
- Hospital/NGO verification results.
- Reminder or expiry notifications where appropriate.
- Read/unread status and notification history.
- Retry handling and delivery status where supported.
- Consent, rate limits and protection against duplicate alerts.
External services must be configured through environment variables. If credentials are missing, the application should report that the provider is unconfigured rather than pretending an alert was sent.
L. Reporting and analytics
- Number of registered donors and verified institutions.
- Active, fulfilled, cancelled and expired requests.
- Donor responses and confirmed matches.
- Average time from request creation to first response.
- Average time to confirmed matching.
- Requests grouped by blood group, urgency and geographic area.
- Donation history and hospital activity summaries.
- Admin filters by date, role and request status.
- CSV export where authorized.
Clearly distinguish actual database-derived statistics from illustrative/demo data.

3. Backend API and database deliverables
Your existing backend/src/app.js mounts these route prefixes:
API prefix	Intended responsibility
/api/auth	Registration, login and authentication
/api/donors	Donor profiles and availability
/api/hospitals	Hospital profiles and verification
/api/patients	Patient profiles
/api/blood-banks	Blood bank-related operations
/api/ngos	NGO-related operations; currently aliases the blood-bank router
/api/blood-requests	Request creation and lifecycle
/api/matches	Matching and donor responses
/api/admin	Administrative operations
/api/notifications	Notification management
/api/health	Service health check
Your /api and /api/health endpoints have already returned successful responses on Vercel. However, directly opening GET /api/donors returned Route not found: GET /api/donors. Claude should inspect donorRoutes.js and its controllers to determine whether the correct endpoint is different or whether a list endpoint is missing.
Proposed database entities
users

Account credentials, roles, contact details and account status


donors

Blood group, availability, last donation date and location


hospitals

Hospital details, address, registration and verification


patients

Patient profile and emergency contact details


ngos

NGO profile, service area and verification


blood_banks

Blood-bank details and available stock, if supported


blood_requests

Required blood group, units, urgency, location and status


donor_matches

Request-donor association, distance, ranking and response status


donations

Confirmed donation records and related request


notifications

Message type, recipient, delivery and read status


verification_records

Verification decisions and supporting audit metadata


audit_logs

Important security and administrative actions



These are the proposed logical entities, not a claim that every table already exists. Claude must inspect the current SQL/schema and migrations first, then identify what is missing.
Database deliverables should include:
- PostgreSQL schema and migrations.
- Primary and foreign keys.
- Appropriate unique constraints and indexes.
- PostGIS extension and spatial columns/indexes.
- Valid status and role constraints.
- Relationships between users, profiles, requests, matches and donations.
- Seed data for development only.
- A documented database setup process.
- Transaction-safe matching and request updates.
- Backup and data-retention considerations.

4. Quality and security requirements
The application should be:
- Responsive on mobile, tablet and desktop.
- Accessible, with readable contrast, labels and keyboard navigation.
- Consistent with the dark navy, red and white BloodMatch branding.
- Built with reusable components and maintainable code.
- Protected by server-side validation and role-based authorization.
- Safe against SQL injection, XSS and unauthorized access.
- Configured through .env variables rather than hardcoded secrets.
- Careful with sensitive personal, health-related and location information.
- Equipped with consistent JSON responses and meaningful HTTP status codes.
- Tested for both success and failure cases.
- Deployable without relying on a developer's local machine or database.
- Clear about which functions are simulated and which are live.
Do not store plain-text passwords, expose database credentials, or put private API secrets in frontend environment variables.

5. Copy this complete instruction into Claude
The following is the working prompt I recommend. Give Claude access to your GitHub repository or project files before asking it to make changes.


Project Enhancement Brief: BloodMatch — Hyperlocal Emergency Blood Donor Matching System
1. Your role
Act as a senior full-stack developer and software architect. Review and enhance my existing college project, BloodMatch, a Hyperlocal Emergency Blood Donor Matching System.
I need a professional, working, demonstrable application—not just an attractive frontend or a set of disconnected mock pages.
Your first responsibility is to inspect the existing repository, understand what is already implemented, identify incomplete or broken features, and prepare an implementation plan. Do not rewrite the entire project or delete existing working functionality.
2. Existing technology stack
Frontend
- React.js with Vite
- Material UI
- Framer Motion
- React Router
- Axios
- Responsive layouts and role-specific portals
Backend
- Node.js
- Express.js
- Modular route files, middleware and configuration
- JWT authentication
- Secure password hashing
Database and matching
- PostgreSQL
- PostGIS for geographic donor matching
- Spatial indexes and geographic distance calculations
Intended external services
- Firebase Cloud Messaging for push notifications
- Twilio for SMS
- WhatsApp notifications only if a supported provider is configured
- Google Maps or OpenStreetMap for map display
Do not assume external services are already configured merely because they are part of the intended architecture.
3. Current repository structure and known implementation
The repository contains frontend files at the root and a separate backend/ directory.
The backend includes:
- backend/server.js
- backend/src/app.js
- backend/src/config/
- backend/src/middlewares/
- backend/src/routes/
- backend/database/
- .env.example
- package.json
- Dockerfile
The backend entry file imports the Express application from ./src/app, loads environment configuration and database configuration, checks the database connection and starts the server.
The Express application currently mounts these prefixes:
- /api/auth
- /api/donors
- /api/hospitals
- /api/patients
- /api/blood-banks
- /api/ngos
- /api/blood-requests
- /api/matches
- /api/admin
- /api/notifications
It also defines /, /api and /api/health.
The Vercel backend deployment has been tested:
- / returns a success message.
- /api returns API information.
- /api/health returns an online status.
However, opening GET /api/donors returned Route not found: GET /api/donors. Investigate the actual donor router, controller and registered methods. Do not assume that every mounted prefix has a working root GET endpoint.
4. Existing frontend pages
The frontend work already includes:
- Public login page
- Registration page
- Role selection page
- Donor dashboard
- Hospital dashboard
- Patient dashboard
- NGO dashboard
- Blood Requests page
- Donors page
- Profile page
- Separate Admin Login page
- Admin Dashboard and Admin Sidebar
- A newer BloodMatch landing-page design featuring the compatibility engine, emergency hero section and workflow explanation
Some pages currently contain hardcoded sample records or statistics. Inspect the code and identify all mock data, placeholder buttons and navigation paths.
Preserve the existing visual identity: dark navy backgrounds, red emergency accents, white typography, rounded cards, clear status indicators and subtle animations.
Do not unnecessarily redesign or replace the current UI. Extend it consistently and connect existing pages to real APIs.
5. User roles and permissions
Implement and verify the following roles:
Donor
- Register and log in.
- Manage personal profile, blood group, location and last donation date.
- Set availability status.
- View compatible nearby requests.
- Receive invitations and accept or decline them.
- View confirmed matches and donation history.
- Receive request and match notifications.
Patient
- Create an emergency blood request.
- Specify blood group, units, hospital/location, urgency and required time.
- Track request and donor-response status.
- View authorized match information.
- Update or cancel eligible requests.
- View previous requests and notifications.
Hospital
- Register and maintain hospital details.
- Submit and manage blood requests.
- Search for compatible eligible donors.
- View authorized donor-match information.
- Track invitations, responses and request status.
- Confirm donation completion through an authorized workflow.
- View request history and statistics.
NGO
- Register and maintain NGO details.
- Submit information for verification.
- Coordinate authorized emergency requests and donor outreach.
- Track assigned requests, responses and outcomes.
- View coordination history and activity statistics.
Admin
- Log in through the separate admin interface.
- View system-wide users, donors, hospitals, NGOs and requests.
- Verify or reject hospitals and NGOs.
- Manage accounts and suspend abusive accounts.
- Monitor urgent, duplicate and unresolved requests.
- View matching outcomes, notification status and audit logs.
- Generate reports and export authorized data.
- Configure appropriate system settings.
Enforce permissions in backend middleware and controllers. Hiding a button or page in React is not sufficient authorization.
Public registration must not permit a user to grant themselves Admin privileges.
6. Core donor-matching functionality
The matching engine is the most important feature.
Implement a backend workflow that:
1. Validates a blood request.
2. Checks compatibility using validated red blood cell transfusion compatibility rules.
3. Excludes unavailable donors.
4. Applies configured eligibility and verification requirements.
5. Applies donation-eligibility checks based on the donor's last donation date and other configured rules.
6. Uses PostGIS to find geographically eligible candidates within a configurable radius.
7. Calculates or retrieves donor-to-request distances.
8. Ranks eligible candidates using compatibility, eligibility, availability, distance and urgency-aware rules.
9. Creates persistent donor-match records.
10. Sends notifications when notification providers are configured.
11. Records donor acceptance, rejection, timeout and other response statuses.
12. Prevents duplicate invitations and handles concurrent updates safely.
13. Tracks request fulfillment and partial fulfillment where supported.
The default radius can be 10 km, but it must be configurable.
Use appropriate spatial indexes and PostGIS distance queries. Do not compare address strings to determine proximity.
Explain the actual matching algorithm, ranking criteria, edge cases and database queries in the documentation.
Blood-group compatibility is only an initial filter. Final donor eligibility, crossmatching and transfusion decisions must remain with qualified medical professionals.
Do not claim that the system is clinically authoritative or guarantees a transfusion.
7. Blood request lifecycle
Implement a consistent request status model covering the necessary states, such as:
- Pending
- Searching for donors
- Match found
- Awaiting confirmation
- Partially fulfilled
- Fulfilled
- Cancelled
- Expired
Use a smaller or different state set if the existing project already defines a sound lifecycle; document the final choices and transitions.
Each request should track:
- Blood group
- Units required
- Units fulfilled, if supported
- Hospital or destination
- Geographic location
- Urgency
- Creator
- Creation and update timestamps
- Expiration or cancellation details
- Request status
- Associated donor matches and responses
Prevent invalid state transitions and preserve important status history.
8. Notifications
Support a notification abstraction for:
- In-app notifications
- Firebase Cloud Messaging
- Twilio SMS
- Optional WhatsApp messaging through a configured provider
Trigger appropriate notifications for:
- New relevant emergency requests
- Donor invitations
- Acceptance or rejection
- Match confirmation
- Request cancellation
- Fulfillment
- Verification decisions
Implement consent checks, duplicate prevention, error handling and delivery status where supported.
Never pretend a notification was sent when the provider is missing or the delivery failed. Clearly distinguish queued, sent, delivered, failed and read states when the provider supports those distinctions.
9. Database requirements
Inspect the existing database schema before making changes.
Verify and implement the necessary relationships for:
- Users and roles
- Donor profiles
- Patient profiles
- Hospital profiles
- NGO profiles
- Blood banks and inventory, if supported by the existing scope
- Blood requests
- Donor matches
- Donations
- Notifications
- Verification records
- Audit logs
Use migrations or a documented schema-management approach. Include appropriate primary keys, foreign keys, unique constraints, indexes and validation.
For geospatial operations:
- Configure PostGIS.
- Use suitable geographic coordinate storage.
- Add spatial indexes.
- Document required extensions and database setup.
Do not expose credentials or seed production with fabricated operational data.
10. API requirements
Audit all existing endpoints before creating new ones.
For every endpoint, document:
- HTTP method and URL
- Authentication requirements
- Allowed roles
- Request body or query parameters
- Success response
- Error responses
- Validation rules
- Database effects
Ensure all actual frontend operations use the correct API methods and paths.
Fix the donor route issue identified above. Also verify authentication, registration, profiles, requests, matching, notifications, hospital/NGO verification and admin endpoints.
Use consistent JSON response structures, appropriate HTTP status codes and centralized error handling.
Do not add unnecessary duplicate endpoints merely to make URLs appear complete.
11. Frontend integration
Connect the existing React pages to the deployed backend through a configurable API base URL.
Requirements:
- Use Axios consistently.
- Configure the API URL through a frontend environment variable.
- Configure CORS correctly for the deployed frontend origin.
- Implement a secure, consistent authentication flow.
- Protect role-specific routes.
- Show loading, empty, success and error states.
- Replace mock records with API data where the corresponding backend functionality exists.
- Preserve usable demo fallbacks only when clearly labeled.
- Ensure filters, search, forms, pagination and buttons actually work.
- Keep dashboards role-specific.
- Update statistics from real backend responses.
- Display accurate request and donor status.
- Avoid exposing private donor details to unauthorized users.
Do not hardcode deployed URLs throughout the codebase.
12. Admin and operational features
Implement the essential admin functions through real backend APIs rather than UI-only placeholders:
- User listing and filtering
- Account status management
- Hospital and NGO verification
- Request monitoring
- Critical request overview
- Matching and notification monitoring
- Reports and statistics
- Audit logs
If a feature needs additional schema or external services, document the dependency and implement it only after verifying the existing architecture.
13. Security and privacy
Apply:
- Secure password hashing
- JWT validation
- Role-based authorization
- Input validation and sanitization where appropriate
- Parameterized database queries
- Rate limiting
- Secure HTTP headers
- Restricted CORS
- Environment-based secrets
- Appropriate error messages without stack traces in production
- Least-privilege data access
- Audit logging for sensitive administrative operations
- Protection of exact donor location and contact information
- Consent-aware location and notification handling
Do not store plaintext passwords, publish private credentials or expose sensitive personal data in public API responses.
14. Testing and acceptance criteria
Create and run appropriate tests for:
- Registration and login
- Invalid credentials
- Unauthorized role access
- Profile creation and updates
- Request creation and cancellation
- Blood-group compatibility
- Donor eligibility and availability
- Geographic radius filtering
- Donor ranking
- Duplicate invitation prevention
- Concurrent match handling
- Donor acceptance and rejection
- Request fulfillment
- Admin verification
- Notification-provider failures
- Invalid API inputs
- Database failures
- Frontend loading and error states
Provide reproducible test instructions and test results. Do not claim that tests pass unless they have actually been run.
15. Deployment and documentation deliverables
Deliver:
1. A feature inventory showing existing, incomplete, missing and blocked functionality.
2. A prioritized implementation plan.
3. Updated backend and frontend code.
4. Database migrations/schema and setup instructions.
5. A complete API endpoint reference.
6. An .env.example with variable names and safe placeholder values.
7. Deployment instructions for the existing hosting setup.
8. A list of required third-party accounts, keys and configuration.
9. Automated tests and their results.
10. A README explaining architecture, installation, database setup, API use and troubleshooting.
11. A demonstration guide with realistic development/test accounts and workflows.
12. A list of known limitations and future enhancements.
Use synthetic data for development and label it clearly. Never include real personal or patient data in seed files.
16. How I want you to work
Work in phases:
Phase 1 — Repository audit
Inspect the actual files, routes, controllers, middleware, schema, frontend API calls and environment configuration. Report the existing functionality, bugs, duplicate code, mock data and missing features.
Phase 2 — Architecture and plan
Provide a prioritized plan with dependencies, exact files to modify, database changes, endpoint changes and testing requirements.
Phase 3 — Critical backend completion
Fix broken routes, authentication, database integration, validation, authorization and request handling.
Phase 4 — Matching engine
Complete and test blood compatibility filtering, donor eligibility, PostGIS geographic search, ranking, persistence and response handling.
Phase 5 — Frontend integration
Connect existing role portals and landing-page actions to working backend functionality without unnecessarily redesigning the interface.
Phase 6 — Notifications, admin and reporting
Implement provider integrations and admin functionality according to the configured environment and actual project requirements.
Phase 7 — Testing and deployment
Run tests, verify environment variables, check the deployed API and document the complete demonstration workflow.
After each phase, summarize what changed, which files changed, how to test it and what remains.
Start with Phase 1 only. Do not immediately generate a completely new application or overwrite existing files. Do not claim a feature is complete without inspecting and testing it. Prioritize a secure, reliable, demonstrable college project over unnecessary complexity.





6. What I recommend asking Claude to implement first
Don't ask Claude to add every feature simultaneously. That makes it easier to introduce broken routes, incompatible schemas and UI regressions.
Choose the first implementation phase

1. Backend audit and repair — routes, database connection, authentication and missing endpoints.


2. Matching engine — compatibility, eligibility, PostGIS search, ranking and donor responses.


3. Frontend integration — replace mock data, connect forms, dashboards and status updates to APIs.


4. Admin completion — verification, user management, monitoring and reports.


5. Notifications — in-app alerts, Firebase, SMS and delivery handling.


Copy prompt for selected phase