# Security model

The application uses Better Auth sessions and server-side authorization. Every protected API must validate the session and authorize the role and resource relationship before it accesses data.

## Current protections

- HTTP-only session handling through Better Auth.
- Role and wedding ownership/collaborator checks on server routes.
- Zod validation on important write paths.
- Secure response headers including `nosniff`, frame restrictions, and referrer policy.
- Server-only secrets for MongoDB and external integrations.
- Rate limits for selected sensitive operations.

## Important limitations

Demo mode stores preview data in the browser and is not a secure account system. Current media storage is MongoDB GridFS for public business-profile images only. Private document storage and malware scanning are not implemented. See [data access](DATA_ACCESS.md), [threat model](THREAT_MODEL.md), and the [deferred media roadmap](../operations/MEDIA_STORAGE_ROADMAP.md).
