# Backup and recovery

Use MongoDB's managed backup capabilities or an approved `mongodump` workflow for the configured deployment. Protect backups with access controls and encryption, and define retention according to the data policy.

Before a data migration, cleanup, or bulk seed:

1. Confirm the selected environment and database name.
2. Confirm a recent restorable backup exists.
3. Test the command on a non-production copy.
4. Record expected changes and the rollback path.
5. Run the production command only with explicit approval.

Perform periodic restore exercises. A backup that has never been restored is not verified recovery.
