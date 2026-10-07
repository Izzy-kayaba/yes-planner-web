# Data architecture

MongoDB is the persistence layer used by the current API. Better Auth owns its authentication collections. Application routes use collections for wedding profiles, business profiles, collaborators, claims, requests, messages, and wedding `workspaceItems`.

## Data rules

- Keep ownership IDs on persisted records and scope every read/write query with them.
- Store money in integer minor units using the documented USD base; format it for display without rewriting stored values.
- Paginated lists use stable sort keys, including `_id` when timestamps or names can tie.
- Add indexes for actual ownership, lookup, and sort patterns; ensure index creation is safe when repeated.
- Use explicit migrations for persisted schema changes and back up before running them.

Vendor profile image bytes currently live in MongoDB GridFS. This design is intentionally retained for now; production object-storage migration, scanning, and private-media work are deferred. See [media roadmap](../operations/MEDIA_STORAGE_ROADMAP.md).

## Currency

The base currency is USD. Amounts use integer US cents and field names such as `amountMinor` or `startingPriceMinor`; no converted ZAR amount is stored. The server can use trusted country headers to detect South Africa and obtain a cached USD/ZAR rate for display. If the visitor is not known to be in South Africa or the rate service is unavailable, display USD. A local-only `DEVELOPMENT_COUNTRY=ZA` override is available for testing.

Do not automatically convert legacy records unless their source currency is known. Conversion is display-only and must never rewrite the stored USD amount. See the [subscriptions and currency note](../domains/subscriptions.md#currency-display-note) and migration guidance in [database migrations](../development/DATABASE_MIGRATIONS.md).
