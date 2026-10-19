# Database changes

Current database-changing commands are documented in [Script operations](../operations/SCRIPTS.md).

## Safe process

1. Read the script and understand every collection it updates.
2. Back up the target and test against a non-production copy.
3. Select the database explicitly with `--env development`, `--env staging`, or `--env production`.
4. Check the printed target environment and database name before proceeding.
5. Verify the resulting documents and application behavior.

Operational scripts are not interchangeable and each has different data effects. Follow the script-specific backup and environment guidance before changing a database.
