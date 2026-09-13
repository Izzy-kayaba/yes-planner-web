# Running Vow Planner locally

## Requirements

- Node.js 20.9 or newer
- npm
- Optional API mode: .NET 10 SDK and SQL Server

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

## API mode with the current .NET backend

Configure the backend in a PowerShell terminal. Use your own local values; do not commit them.

```powershell
$env:Database__Provider = "SqlServer"
$env:ConnectionStrings__SqlServer = "<your SQL Server connection string>"
$env:Jwt__Key = "<at least 32 random bytes>"
$env:Jwt__Issuer = "VowPlanner.API"
$env:Jwt__Audience = "VowPlanner.API"
dotnet run --project .\VowPlanner.API --launch-profile http
```

The API listens on `http://localhost:5227` with the checked-in launch profile. Database migrations are applied at startup.

In `VowPlanner-UI/.env.local`, set:

```dotenv
NEXT_PUBLIC_DATA_SOURCE=api
NEXT_PUBLIC_API_URL=http://localhost:5227
```

Restart Next.js after changing environment variables. Register a normal account before opening authenticated workspace data.

## Verification

Frontend:

```powershell
npm.cmd run validate
npm.cmd audit --offline
```

Backend:

```powershell
dotnet test VowPlanner.slnx --no-restore
dotnet build VowPlanner.slnx --no-restore --configuration Release
```
