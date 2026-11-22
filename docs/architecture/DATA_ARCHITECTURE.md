# Data architecture

MongoDB is the persistence layer used by the current API. Better Auth owns its authentication collections. Application routes use collections for wedding profiles, business profiles, collaborators, claims, requests, messages, and wedding `workspaceItems`.

## Data rules

- Keep ownership IDs on persisted records and scope every read/write query with them.
- Store money in integer minor units; keep the numerical amount unchanged and format it using the user's permanent currency preference.
- Paginated lists use stable sort keys, including `_id` when timestamps or names can tie.
- Add indexes for actual ownership, lookup, and sort patterns; ensure index creation is safe when repeated.
- Use explicit migrations for persisted schema changes and back up before running them.

Vendor profile image bytes currently live in MongoDB GridFS. This design is intentionally retained for now; production object-storage migration, scanning, and private-media work are deferred. See [media roadmap](../operations/MEDIA_STORAGE_ROADMAP.md).

## Currency

Amounts use integer minor units and field names such as `amountMinor` or `startingPriceMinor`. Each user selects ZAR or USD during onboarding; that choice is stored on the user and controls display formatting. South African traffic defaults to ZAR and other locations default to USD, but the user must confirm the choice. A local-only `DEVELOPMENT_COUNTRY=ZA` override is available for testing.

Do not convert records, fetch exchange rates, or rewrite stored amounts. Existing records retain their numerical values and are displayed using the signed-in user's currency preference. See migration guidance in [database migrations](../development/DATABASE_MIGRATIONS.md).
