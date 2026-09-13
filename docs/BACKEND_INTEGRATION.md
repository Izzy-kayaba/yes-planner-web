# Backend integration

The frontend talks to one replaceable boundary (backend adapter). Feature components do not know whether records come from .NET, another language, or browser preview storage.

## Selecting a data source

`NEXT_PUBLIC_DATA_SOURCE=demo` uses browser storage. `NEXT_PUBLIC_DATA_SOURCE=api` uses the HTTP adapter in `lib/api/backend.ts`.

The public contract is `BackendAdapter` in `lib/api/contracts.ts`. It covers:

- register and login;
- list records for a wedding module;
- create a record;
- update a record;
- delete a record.

Supported modules are guests, budget, tasks, vendors, timeline, seating, food and drinks, documents, bookings, payments, messages and notes.

## HTTP contract

Authentication:

```text
POST /api/v1/auth/register
POST /api/v1/auth/login
```

Both return:

```json
{ "token": "..." }
```

Workspace records:

```text
GET    /api/v1/weddings/{weddingKey}/workspace/{module}
POST   /api/v1/weddings/{weddingKey}/workspace/{module}
PUT    /api/v1/weddings/{weddingKey}/workspace/{module}/{id}
DELETE /api/v1/weddings/{weddingKey}/workspace/{module}/{id}
```

Requests and responses are ordinary JSON records. The server supplies the `id` on creation. Authenticated requests send `Authorization: Bearer <token>`.

## Connecting a different backend

1. Implement the methods in `BackendAdapter`.
2. Keep conversion code inside the new adapter. For example, translate a backend's `snake_case` fields there.
3. Select the adapter in `getBackend()`.
4. Do not import backend-generated types into feature components.
5. Keep errors compatible with `{ "message": "Readable explanation" }`, or translate them in the adapter.

This approach lets a REST API, GraphQL service, Firebase, Supabase or another backend replace the current .NET API without changing the screens.

## Security boundary

The frontend may hide unavailable controls for clarity, but the backend must make every access decision again. The current workspace endpoint scopes records to the authenticated user, wedding key and module. The full couple/planner shared-access model will require persisted wedding memberships before production use.

The current adapter stores its access token in browser storage for the local prototype. A production deployment should prefer a secure, HTTP-only cookie or a server-side frontend session so browser scripts cannot read long-lived credentials.

File uploads currently save metadata in preview mode. A production backend should issue short-lived object-storage upload URLs, validate file type and size, and save only the resulting storage reference.
