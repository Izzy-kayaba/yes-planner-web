# ADR-003: Planner access model

- Status: Accepted
- Date: 2026-10-08

## Decision

A Vendor offering Wedding planning receives no access by default. The Couple must assign the planner to a specific wedding; an accepted active collaboration grants full management of that wedding and can be revoked by the Couple.

## Why

Business capability does not imply consent to access a specific couple's information. Scoped assignment makes the relationship explicit and reversible.

## Consequences

Authorization checks the caller's role, service, wedding key, owner, and collaboration status. Removing planner access must not accidentally remove a different active service collaboration.
