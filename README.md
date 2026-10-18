# BloodMatch

React/Vite + Material UI frontend, Express API, PostgreSQL/PostGIS matching and optional Socket.IO, Twilio and Firebase notifications.

Read [setup and deployment](docs/DEPLOYMENT.md), [feature inventory and limitations](docs/IMPLEMENTATION.md), [API reference](docs/API.md), and [test/demo guide](docs/TESTING.md) before running against real user data.

```powershell
npm ci --ignore-scripts
# Configure .env and backend/.env from their examples first.
npm run init-db --workspace backend
npm run dev --workspace backend
# In another terminal:
npm run dev
```

Existing databases use `npm run migrate --workspace backend` instead of initialization. No default administrator or fabricated operational records are seeded. Use environment-based administrator provisioning described in the deployment guide.

Matching applies the shared red-cell compatibility matrix, consent, account activity, availability, age/weight screening and configurable donation interval, then PostGIS ST_DWithin/ST_Distance. Exact blood groups rank first, then distance. Default search radius is 10 km and can be changed by an administrator; critical matching respects the radius and emergency-ready setting. Geography expression indexes support metre-based spatial queries.

Requests progress through active → matching → fulfilled, cancelled or expired. Partial fulfillment is recorded with unit counts while the request stays open. Only the responsible verified hospital can confirm donations. Final eligibility and transfusion decisions require qualified medical professionals and clinical testing.

`npm test`, `npm run build`, `npm run lint`, and `npm audit` provide local checks. Integration tests require an explicit disposable TEST_DATABASE_URL and clear that database's application records. See the test guide.
