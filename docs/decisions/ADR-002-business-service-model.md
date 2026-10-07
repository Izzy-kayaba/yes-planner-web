# ADR-002: Business service model

- Status: Accepted
- Date: 2026-10-08

## Decision

Business services are profile data. A wedding planner is a Vendor offering the Wedding planning service, not a distinct account role. Venue remains a distinct account type.

## Why

One business can offer several wedding services without creating a separate login role for each category. Venue product needs also differ from ordinary vendor experiences.

## Consequences

Service eligibility is checked separately from account role. Venue profiles cannot offer the Wedding planning service. Legacy Planner accounts require migration to Vendor plus a Wedding planning service.
