# Weddings

A wedding is owned by the Couple who created it. The `weddingProfiles` collection contains the wedding's overview fields; `workspaceItems` stores records grouped by wedding key and module.

Current modules include guests, budget, tasks, vendors, timeline, seating, food and drinks, documents, bookings, payments, and notes. A module API must verify the caller's session and wedding access before reading or changing records.

Planner access is an explicit active collaboration and can be revoked by the Couple. A Venue receives a small read-only wedding brief rather than access to the workspace. See [wedding ownership](../decisions/ADR-001-wedding-ownership.md) and [authorization](../architecture/AUTHORIZATION.md).
