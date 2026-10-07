# API architecture

Next.js route handlers under `app/api/v1` form the current application API. `lib/api/client.ts` sends browser requests, while `lib/api/backend.ts` selects either the HTTP backend or browser-only demo adapter.

Route handlers authenticate, validate request data, authorize access, and then query or update MongoDB. Frontend permissions are presentation only. A separate backend can replace MongoDB only if it preserves session security, ownership, and collaborator checks.

Current route groups include auth and account settings, vendor profiles and requests, marketplace listings, vendor claims, messages, administration, and wedding workspace modules. Vendor-profile media endpoints currently serve public profile imagery only.

List routes share a one-based `page` and bounded `pageSize` query with an `{ items, pagination }` response. See the [endpoint-by-endpoint reference](../api/ENDPOINTS.md), [API conventions](../api/API_CONVENTIONS.md), [error handling](../api/ERROR_HANDLING.md), and [versioning](../api/VERSIONING.md).
