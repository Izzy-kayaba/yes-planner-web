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
