# Data access

When adding a data path, start with the trusted session user ID. Resolve the wedding owner from server-side records, then apply the shared wedding-access policy. Never trust owner IDs, roles, or access levels supplied by a browser request.

MongoDB queries should include the authorized owner and record scope in the query itself. Avoid loading an unrestricted collection and filtering it in application memory. Validate identifiers and module names before querying.

Public marketplace data is intentionally public after a profile is published. Wedding profiles, messages, claims, and workspace records are not public. Current media URLs are restricted to explicitly public vendor-profile images; do not store private documents in that route.
