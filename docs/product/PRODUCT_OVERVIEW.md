# Product overview

Yes Planner is a web application for planning weddings and coordinating the people and businesses involved. The current application is a Next.js service with a couple-oriented wedding workspace, business discovery, vendor tools, administration, and a guest invitation experience.

## Current experiences

- Couples plan guests, budgets, tasks, vendors, timelines, seating, food, documents, bookings, payments, notes, and reports.
- Vendors and venues maintain a business profile and appear in the marketplace.
- Wedding-planning Vendors can manage a couple's wedding after the couple assigns and accepts them.
- An assigned Venue can view a small read-only wedding brief.
- Guests can respond to an invitation.
- System administrators review accounts and business-profile claims.

The workspace, roles, and access policy described here are enforced by server routes in API mode. Demo mode is a browser preview, not a security boundary.

## Language and presentation

The interface supports English and French. A signed-in user can switch language; the choice is stored in a cookie. Light, dark, and system themes are supported. The current currency display uses USD as its stored base and may present ZAR for a detected South African visitor.

## Scope boundaries

The current codebase does not yet provide a persisted multi-staff organisation workspace, subscription billing, private wedding document storage, production object storage, or malware scanning. See the [feature matrix](FEATURE_MATRIX.md) and [roadmap](ROADMAP.md).
