# ADR-001: Wedding ownership

- Status: Accepted
- Date: 2026-10-08

## Decision

The Couple account owns its wedding. A Vendor or Venue assignment does not transfer ownership.

## Why

The Couple remains responsible for wedding decisions and must be able to manage or revoke the relationships it grants. Businesses need scoped access to perform assigned work without becoming the owner of the couple's data.

## Consequences

Workspace data is scoped to the wedding owner and wedding key. Collaborators are stored separately and checked on every request. Any future organisation feature must preserve the existing ownership rule unless a new decision explicitly replaces it.
