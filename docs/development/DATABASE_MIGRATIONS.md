# Database migrations

Database migrations are explicit Node scripts under `scripts/`. They are not run automatically when the web application starts.

## Safe process

1. Read the script and understand every collection it updates.
2. Back up the target and test against a non-production copy.
3. Select the database explicitly with `--env development` or `--env production`.
4. Check the printed target environment and database name before proceeding.
5. Verify the resulting documents and application behavior.

The user-model migration converts legacy Planner users to Vendor accounts with the Wedding planning service and copies profile/collaboration data. The vendor seeder upserts profile data from a JSON file. The media cleanup script deletes old unreferenced GridFS images. These scripts are not interchangeable and each has different data effects.

The migration scripts do not currently provide a general automatic rollback. Restore from a verified backup if a migration produces incorrect data.
