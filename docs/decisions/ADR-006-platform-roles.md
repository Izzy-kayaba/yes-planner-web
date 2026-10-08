# ADR-006: Separate platform staff roles

- Status: Accepted
- Date: 2026-10-08

## Decision

Internal platform permissions are stored separately from customer account type, organisation membership, and wedding collaboration access. Platform authority is read from the server-side user's `platformRoles` array and checked at page and API boundaries.

The legacy `SystemAdmin` account role remains a compatibility mapping to `SuperAdmin` while existing records transition.

## Why

Customer features, venue operations, and wedding planner assignments have distinct ownership and permission scopes. Reusing a customer role or trusting browser navigation for internal administration would blur those scopes and create a direct-access security gap.

## Consequences

Every administrative feature needs an explicit permission mapping and server guard. Client navigation is filtered for usability but is not a security boundary. Public registration remains limited to customer account types. Sensitive administrative changes are audited with metadata only.

Organisation roles will be added to the organisation domain when its membership model is implemented; they will not be encoded as platform roles.
