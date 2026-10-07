# Local setup

## Requirements

- Node.js 20.9 or newer.
- npm.
- MongoDB for API mode; demo mode can run without a database.

In PowerShell:

```powershell
Copy-Item .env.example .env.local
npm.cmd install
npm.cmd run dev
```

Open `http://localhost:3000`. For a browser-only preview, set `NEXT_PUBLIC_DATA_SOURCE=demo`. For real sessions and persisted data, set it to `api` and fill in the development database and Better Auth values in `.env.local`.

For API mode, configure at least:

```dotenv
NEXT_PUBLIC_DATA_SOURCE=api
MONGODB_DEVELOPMENT_URI=mongodb://127.0.0.1:27017
MONGODB_DEVELOPMENT_DATABASE=yes_planner_development
MONGODB_USE_TRANSACTIONS=false
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=<a unique random value of at least 32 characters>
```

Add Google/Instagram provider values only when testing those providers. For email delivery, configure a Resend key and verified sender; settings include a test-email action. The email HTML is generated in `lib/email.ts`.

Useful preview routes include `/`, `/register`, `/login`, `/dashboard`, `/marketplace`, `/vendor`, `/admin`, and `/invite/ruth-and-izzy`. Preview records are stored in browser storage, not MongoDB.

Never use production data for routine local development. See [environment guidance](../operations/ENVIRONMENTS.md) and [testing](TESTING.md).
