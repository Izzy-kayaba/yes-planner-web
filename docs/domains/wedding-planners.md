# Wedding planners

A wedding planner is a Vendor whose business profile offers the `Wedding planning` service. No separate `Planner` account role is required for new authorization decisions.

Planner eligibility alone gives no access to a couple's wedding. The Couple must assign the planner service, and an accepted active collaboration provides full management access to that wedding only. The Couple can revoke that assignment.

Legacy Planner records are migrated to Vendor accounts with the Wedding planning service by the user-model migration. Follow [database migration instructions](../development/DATABASE_MIGRATIONS.md) before using the migration on any database.
