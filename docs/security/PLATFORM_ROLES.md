# Platform roles

Platform roles grant narrowly defined access to internal administration features. They are distinct from customer account type (`Couple`, `Vendor`, `Venue`) and wedding collaboration access.

## Role capabilities

| Platform role   | Current permissions                                                           |
| --------------- | ----------------------------------------------------------------------------- |
| `SuperAdmin`    | All currently defined platform permissions, including staff management        |
| `PlatformAdmin` | Dashboard, users, wedding metadata, businesses, venues, verification, support |
| `Support`       | Dashboard, user metadata, support queue and status updates                    |
| `Verification`  | Dashboard, business/venue metadata, verification queue and decisions          |
| `Operations`    | Dashboard, integration status/tests, audit events                             |
| `Finance`       | No capabilities until billing administration is implemented                   |

The authoritative role-to-permission mapping lives in `lib/auth/platform-permissions.ts`. Keep the mapping explicit: adding a role does not grant access until permissions are intentionally assigned.

## Storage and compatibility

Platform roles are stored in the server-side user's `platformRoles` array. They are not accepted during public registration and are never read from client-provided role fields. Legacy `SystemAdmin` accounts map to `SuperAdmin` while records are migrated.

An account may retain its customer account type while also receiving internal platform access. Removing `SuperAdmin` restores the stored customer account type; it does not alter wedding ownership or organisation membership.

## Change requirements

For each new permission:

1. Add the permission and role mapping centrally.
2. Guard its pages and API handlers on the server.
3. Filter navigation using that same permission.
4. Add allowed and denied authorization tests.
5. Update the [permission matrix](PERMISSION_MATRIX.md) and relevant API/domain documentation.
6. Audit sensitive mutations without recording private customer content or secrets.

Do not use a hidden link, client role check, or admin dashboard card as the only authorization control.
