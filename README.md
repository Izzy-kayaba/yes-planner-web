# Yes Planner

Yes Planner is a mobile-first wedding-planning web application built with Next.js, React, TypeScript, Better Auth, and MongoDB.

## What is included

- Couple wedding workspace for guests, budget, tasks, vendors, timeline, seating, food, documents, bookings, payments, and notes.
- Vendor and Venue business profiles and marketplace discovery.
- Couple-assigned, wedding-specific planner access.
- Read-only wedding brief for an assigned Venue.
- Guest invitation and RSVP experience.
- English and French interface, responsive navigation, and light/dark themes.

The Venue organisation, staff, subscription, and production media-storage capabilities described in the long-term product direction are not all implemented yet. Read the [feature matrix](docs/product/FEATURE_MATRIX.md) before assuming a capability is available.

## Quick start

Requirements: Node.js 20.9 or newer, npm, and MongoDB for persisted API mode.

```powershell
Copy-Item .env.example .env.local
npm.cmd install
npm.cmd run dev
```

Set `NEXT_PUBLIC_DATA_SOURCE=demo` for a browser-only preview or `api` for MongoDB-backed accounts and data. Keep credentials out of source control.

## Verification

```powershell
npm.cmd run test:all
```

For local setup, test configuration, API conventions, architecture, permissions, and operational guidance, start at the [documentation index](docs/README.md).
