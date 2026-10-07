# Domain model

The current persisted model is user-centered. A couple owns a wedding profile; a business account owns a vendor-profile document; a wedding-collaborator record grants scoped access to one wedding.

```text
User (Couple) ──owns──> WeddingProfile
       │                    │
       │                    ├──> WorkspaceItems
       │                    ├──> VendorRequests
       │                    └──> WeddingCollaborators
       │                                  └──> User (Vendor)
       └── account/session data

User (Vendor or Venue) ──owns──> VendorProfile
                                      └── references public media URLs
```

Important rules:

- Wedding ownership belongs to the Couple, not a planner or Venue.
- A Vendor's service list is separate from the account role.
- Planner access is represented as a wedding-specific active collaboration.
- A Venue sees a limited summary and cannot manage wedding workspace records.
- An organisation and its staff are not yet persisted as first-class records.

Collection and route names can evolve. Update this page when a migration changes ownership or access relationships.
