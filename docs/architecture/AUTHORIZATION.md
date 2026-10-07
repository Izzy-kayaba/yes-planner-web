# Authorization

The server is the final authority. Hiding a button in React improves the experience but does not grant or revoke permission.

For each protected request:

1. Validate the Better Auth session.
2. Check that the account role can use the route.
3. Resolve the wedding owner from trusted server data.
4. Check for an active collaboration when the caller is not the owner.
5. Apply the collaborator access level and module policy.
6. Scope the database query to the authorized owner and wedding.

The Couple and System Admin have broad workspace access subject to route policy. A Vendor receives management access only when the couple assigns that Vendor's wedding-planning service. A Venue receives only the read-only brief. Guests cannot use internal workspace APIs.

See the [permission matrix](../security/PERMISSION_MATRIX.md) and [authorization decision record](../decisions/ADR-005-authorization-model.md).
