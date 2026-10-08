# Platform administration

Platform administration is an internal Yes Planner workspace. It is separate from customer account types, organisation membership, and wedding-specific access.

## Current capabilities

- The dashboard shows only cards allowed by the signed-in staff member's platform permissions.
- User administration exposes account metadata, not private wedding content.
- Wedding administration lists only display name, date, venue, and country. It does not expose notes, budgets, messages, guests, documents, or payment details.
- Business and venue directories list profile metadata. Venue profiles remain a separate first-class business experience and are not reduced to an ordinary vendor service.
- Verification staff review business claims through the existing claim workflow.
- Support requests are visible to permitted support staff. A requester can list only their own requests.
- Email integration tests call the configured Resend service server-side. Recipient addresses, email content, and provider credentials are not copied into audit events.
- Audit screens contain actor, permission, action, resource metadata, outcome, and timestamp. Do not add personal content or secrets to audit records.
- Super Admins can grant and revoke platform roles for existing accounts. Public account registration cannot create platform staff.

## Authorization boundaries

`platformRoles` on the persisted user document are the source of platform staff authority. The browser receives filtered navigation for convenience, but every page and API checks permissions on the server. Better Auth's legacy `SystemAdmin` role remains mapped to `SuperAdmin` during migration.

Platform staff permissions do not grant ownership of a couple's wedding. Administrative wedding listings deliberately minimize personal information. If future operational workflows need deeper access, add a specific permission, purpose limitation, audit event, and tests before exposing it.

Organisation staff roles belong to the organisation domain and must not be stored in `platformRoles`. Wedding planner authority comes from the couple's active wedding-specific assignment; platform staff roles do not create planner assignments.

## Provisioning

Create the initial Super Admin only for an existing Better Auth user:

```powershell
npm.cmd run admin:set -- admin@example.com --env development
```

Grant or revoke additional internal roles:

```powershell
npm.cmd run admin:role -- grant Support support@example.com --env development
npm.cmd run admin:role -- revoke Support support@example.com --env development
```

Both commands require an explicit environment. Review the printed database target before running against production, and use a verified existing account. The application UI can also manage platform roles but will not allow removal of the final Super Admin.

## Planned work

Organisation workspaces, organisation membership/permissions, venue space and booking operations, subscriptions, and analytics are future domain work. Existing directories are metadata views and must not be represented as those completed capabilities.
