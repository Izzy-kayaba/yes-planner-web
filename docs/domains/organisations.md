# Organisations

## Current status

An organisation is not yet a persisted tenant in this application. The current Venue account owns an individual business profile; there are no organisation membership, staff, space, or organisation-wedding collections. The demo organisation screen must not be used to infer production permissions.

## Intended direction

An organisation should own or manage many events through explicit memberships. Staff access should be granted through permissions that can evolve rather than a fixed set of job-title strings. The Couple must remain owner of their wedding unless a future product decision explicitly changes that domain rule.

Before implementation, design migration of user-owned business profiles and wedding collaborations, access revocation, audit history, and subscription capabilities. See [multi-tenancy](../architecture/MULTI_TENANCY.md) and [ADR-004](../decisions/ADR-004-venue-organisation-model.md).
