# Incident response

## First response

1. Confirm the affected environment and whether the problem is ongoing.
2. Check hosting logs, the health endpoint, and the database/provider status.
3. Limit impact without disabling authentication, TLS verification, or authorization.
4. Preserve sanitized logs and timestamps for investigation.
5. Communicate user impact and next update time.

## Database unavailable

Check the production environment variables in the hosting secret manager, database access permissions, network allow-list, cluster status, and URI encoding. Redeploy after correcting configuration. Never paste a connection string into an issue, chat, or log.

Run safe local checks one at a time with `npm.cmd run typecheck`, `npm.cmd run check:lines`, `npm.cmd run format:check`, and `npm.cmd run build`. For a deployment, check `/api/health` and correlate the response with server logs. Do not disable TLS certificate validation to work around a certificate-chain problem; fix the trusted certificate or proxy configuration instead.

## Credential exposure

Revoke or rotate the exposed credential at its provider immediately, update the secret manager, redeploy, and investigate usage. Removing a value from the current file does not remove it from prior Git history.

## Recovery

Use the documented restore process, validate the restored data in an isolated environment, and record the incident timeline and follow-up work.
