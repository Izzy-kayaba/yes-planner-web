# Permission matrix

This summarizes current application policy. API handlers remain authoritative and can narrow access for individual resources.

| Capability               | Couple owner | Assigned planner Vendor | Other assigned Vendor     | Assigned Venue | Guest | System Admin          |
| ------------------------ | ------------ | ----------------------- | ------------------------- | -------------- | ----- | --------------------- |
| Read wedding workspace   | Yes          | Yes                     | Limited by route policy   | No             | No    | Yes                   |
| Manage wedding workspace | Yes          | Yes, for that wedding   | No general planner access | No             | No    | Yes                   |
| Read venue brief         | Yes          | Yes as authorized       | No general access         | Yes, read-only | No    | Yes                   |
| Assign/revoke planner    | Yes          | No                      | No                        | No             | No    | Administrative policy |
| Review business claims   | No           | No                      | No                        | No             | No    | Yes                   |

An account's offered services do not grant access to any specific wedding. Planner access requires an active assignment by the Couple. Venue access never implies planner or workspace permissions.

## Internal platform administration

Internal staff access uses separate persisted `platformRoles`; it does not grant wedding ownership or organisation membership. Each page and API enforces its permission server-side.

| Capability                     | SuperAdmin | PlatformAdmin | Support | Verification | Operations | Finance |
| ------------------------------ | ---------- | ------------- | ------- | ------------ | ---------- | ------- |
| Dashboard                      | Yes        | Yes           | Yes     | Yes          | Yes        | No      |
| User metadata                  | Yes        | Yes           | Yes     | No           | No         | No      |
| Wedding metadata               | Yes        | Yes           | No      | No           | No         | No      |
| Business and venue directories | Yes        | Yes           | No      | Yes          | No         | No      |
| Verify business claims         | Yes        | Yes           | No      | Yes          | No         | No      |
| Support requests               | Yes        | Yes           | Yes     | No           | No         | No      |
| Manage platform staff          | Yes        | No            | No      | No           | No         | No      |
| Test configured integrations   | Yes        | No            | No      | No           | Yes        | No      |
| View audit events              | Yes        | No            | No      | No           | Yes        | No      |

`Finance` is reserved for future billing administration and intentionally has no current permissions.
