# System overview

Yes Planner is a Next.js App Router application. Its server-rendered pages and API routes run in the same application. MongoDB stores Better Auth records and application records. The browser calls versioned `/api/v1` routes using an HTTP-only authentication session.

```text
Browser
  ├── Next.js pages and client components
  ├── language and theme providers
  └── fetch + Better Auth session cookie
          ↓
Next.js server routes
  ├── authenticate the request
  ├── check role, ownership, and collaborator access
  └── read or update MongoDB
          ↓
MongoDB
  ├── Better Auth collections
  ├── wedding and business profiles
  ├── collaborators, requests, and claims
  ├── workspace records
  └── vendor media in GridFS (current implementation)
```

The frontend has a demo adapter for previews and an HTTP adapter for persisted API mode. Demo mode uses browser storage and must not be used as a production authorization boundary.

Current integrations include Better Auth, MongoDB, Resend, optional OAuth providers, and optional WhatsApp notifications. See [integration architecture](INTEGRATION_ARCHITECTURE.md) and [system diagram notes](diagrams/README.md).
