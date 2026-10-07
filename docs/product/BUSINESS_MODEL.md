# Business model

Yes Planner is intended to support couples, individual wedding professionals, and larger venue or wedding organisations. Higher-value organisation subscriptions are part of the long-term direction, but subscription billing and plan enforcement are not implemented in this repository.

## Current application

There is no billing provider integration, subscription record, or entitlement check. A business profile is not evidence of a paid plan. Existing capabilities are granted by account and wedding-access rules.

## Future direction

Organisation subscriptions should unlock capabilities such as staff management, multiple event workspaces, venue-space management, reporting, and operational tools. Authorization should ask whether an organisation has a capability, not compare a hard-coded plan name. This allows pricing to change without rewriting domain permissions.

See [subscriptions](../domains/subscriptions.md), [multi-tenancy](../architecture/MULTI_TENANCY.md), and [the roadmap](ROADMAP.md).
