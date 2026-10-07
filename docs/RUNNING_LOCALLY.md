# Running Yes Planner locally

## Requirements

- Node.js 20.9 or newer
- npm
- MongoDB 7 or a MongoDB Atlas development database

## Browser preview mode

Preview mode needs no backend. Editable records are saved in browser storage.

```powershell
Copy-Item .env.example .env.local
npm.cmd install
npm.cmd run dev
```

Keep `NEXT_PUBLIC_DATA_SOURCE=demo` in `.env.local`, then open `http://localhost:3000`.

Useful routes:

- `/` — public product page
- `/login` and `/register` — authentication previews
- `/dashboard` — couple dashboard
- `/weddings/ruth-izzy` — shared wedding workspace
- `/marketplace` — vendor discovery
- `/organisations/beautiful-day` — planner organisation
- `/vendor` — vendor workspace
- `/admin` — platform operations
- `/invite/ruth-and-izzy` — guest RSVP

To clear preview edits, remove keys beginning with `yes-planner:` from browser storage.

## MongoDB-backed API mode

Copy the example environment file, then use your own local values. Do not commit `.env.local`.

```powershell
Copy-Item .env.example .env.local
```

At minimum, set:

```dotenv
NEXT_PUBLIC_DATA_SOURCE=api
NEXT_PUBLIC_API_URL=
MONGODB_DEVELOPMENT_URI=mongodb://127.0.0.1:27017
MONGODB_DEVELOPMENT_DATABASE=yes_planner_development
MONGODB_USE_TRANSACTIONS=false
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=<a unique random value of at least 32 characters>
```

Add provider credentials when Google or Instagram login is required, then start Next.js with `npm.cmd run dev`. Register a normal account before opening authenticated workspace data.

## Verification

Frontend:

```powershell
npm.cmd run validate
npm.cmd audit --offline
```

The legacy .NET project is verified independently in its own repository and is not required by this application at runtime.

## Database maintenance scripts

Maintenance commands load `.env.local` automatically for development. They require `MONGODB_DEVELOPMENT_URI` and `MONGODB_DEVELOPMENT_DATABASE`. For production, set `NODE_ENV=production` and provide `MONGODB_PRODUCTION_URI` and `MONGODB_PRODUCTION_DATABASE` in `.env.production` or `.env.production.local.

They intentionally stop with a clear error when those values are missing. They cannot run in browser demo mode or without database credentials. After confirming the target and taking a backup, run:

```powershell
npm.cmd run migrate:user-model
npm.cmd run media:cleanup
npm.cmd run admin:set -- admin@example.com
npm.cmd run seed:vendors
```

`seed:vendors` reads `data.json` by default. Pass another data-file path as its first argument when needed. `MONGODB_USE_TRANSACTIONS` is used by the application runtime, not by these scripts.
