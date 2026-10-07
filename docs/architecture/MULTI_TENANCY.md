# Multi-tenancy

## Current boundary

The current application is scoped primarily by authenticated user ID and wedding key. Workspace queries include the owner and wedding scope; collaborators are looked up by their active, wedding-specific assignment. MongoDB collections share a selected database, but that does not make all records visible to every user.

Venue accounts currently own one business-profile document. There is no persisted organisation, membership, staff, or organisation-scoped permission model. The `/organisations` page is a demo surface rather than a production organisation workspace.

## Future boundary

Introduce explicit organisation IDs and memberships before allowing staff or one organisation to manage many weddings. Every query must include an authorized tenant scope. Define how existing user-owned profiles and couple-to-business collaborations migrate while preserving Couple ownership.

Subscription entitlements should be checked as capabilities after organisation membership is validated. Do not use plan labels as authorization checks.
