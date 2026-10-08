# Administrative access

## Enforcement

Server-rendered administration pages call `requirePlatformPagePermission`. Administrative API routes call `requirePlatformApiPermission`, which returns `401` without a valid session and `403` when the session lacks the required persisted platform permission. The navigation in `AppShell` is only a user-interface filter.

Permission lookup loads `platformRoles` from the Better Auth user record. The legacy `SystemAdmin` role is temporarily treated as `SuperAdmin`. Never trust permissions supplied by a request body or local storage.

## Data minimization

User lists show basic account metadata. Wedding lists show display name, wedding date, venue, and country only. Business directories show public profile fields. Support staff can view support-request details to respond to the request, while users can only read their own requests. Audit lists omit request bodies and integration secrets.

Any new access to private wedding records requires a dedicated use case and permission; do not broaden the current metadata endpoints by projecting full documents.

## Role changes

Only `platform_staff.manage` can assign or revoke platform roles. The page is visible to Super Admins, mutations are audited, and the last Super Admin cannot be removed through the application. Provisioning scripts require explicit `--env development` or `--env production`.

Super Admin access should be granted to an existing account with verified ownership and removed promptly when no longer required. Use named individual accounts; do not share administrator credentials.
