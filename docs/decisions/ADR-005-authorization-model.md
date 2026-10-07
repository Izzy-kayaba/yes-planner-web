# ADR-005: Authorization model

- Status: Accepted
- Date: 2026-10-08

## Decision

The server enforces authentication, account role, ownership, and active collaborator access at every protected boundary. Client-side visibility checks are not authorization.

## Why

Browser code can be bypassed. Ownership and wedding assignments must be evaluated from persisted server data so changing a URL or request body cannot grant access.

## Consequences

Route handlers must reuse shared policy helpers and scope data access to authorized records. Add tests for both allowed and denied cases when a policy changes. Organisation membership and subscription capabilities will extend this model when their domain data exists.
