# Subscriptions

## Current status

Subscription billing, invoices for platform plans, and entitlement enforcement are not implemented. Do not infer a subscription from an account role, profile, or route.

## Future capability model

The planned venue/organisation product may support higher-value SaaS subscriptions. Represent enabled capabilities separately from human-readable plan names. Check organisation membership first, then check the capability required for an action. This keeps authorization stable when pricing or plan packaging changes.

Potential capability areas include multiple wedding workspaces, staff seats, venue spaces, bookings, reports, and operational documents. The list is illustrative and is not a commitment to a pricing tier.

## Currency display note

Application money is stored in integer USD cents. A South African viewer may see a converted ZAR display amount; this is presentation only and does not mutate stored balances. See [data architecture](../architecture/DATA_ARCHITECTURE.md).
