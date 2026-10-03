# Running Vow Planner locally

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

To clear preview edits, remove keys beginning with `vow-planner:` from browser storage.

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
MONGODB_DEVELOPMENT_DATABASE=vow_planner_development
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
