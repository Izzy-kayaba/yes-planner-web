# Vow Planner: project overview

**Audience:** marketing, product, engineering, design, operations and business stakeholders  
**Document purpose:** shared, plain-language overview of the product direction and the current implementation  
**Status:** working product overview; confirm launch scope and integrations before using future-facing statements as public claims

## At a glance

Vow Planner is a wedding-planning platform intended to bring the couple, their planner, wedding-service businesses and invited guests into one coordinated experience. Its central idea is a shared wedding workspace: planning information such as guests, budget, tasks, vendors and dates should be available in the context where the wedding is managed, rather than scattered across separate spreadsheets, inboxes and chat threads.

The product has two connected sides:

- A consumer experience for couples to organise a wedding, coordinate with a planner and communicate approved information to guests.
- A business experience for planners and wedding-service providers to present their services and manage relevant client work.

The current project contains a responsive Next.js application with protected server routes, Better Auth and MongoDB. It can run in a browser-only preview mode or in database-backed API mode. The separate ASP.NET Core project is now a legacy integration option rather than the active web runtime. A mobile-native app is not present in the current `vow-planner-mobile` folder; the current mobile experience is the responsive website.

## The problem Vow Planner addresses

Wedding planning often spans spreadsheets, calendars, email, messaging apps, paper documents and vendor websites. Couples and planners can lose track of decisions, guest responses, costs, responsibilities and deadlines when each item lives in a different place. Vendors may not have a clear view of the information they need for their booking, and guests may need to contact the couple for details that could have been shared in advance.

Vow Planner aims to provide one organised place to keep the planning work visible and connected. The intended benefit is less coordination overhead, clearer responsibilities and a better informed experience for everyone involved.

## Who can use it

| Audience                   | Need                                                         | Intended Vow Planner experience                                                                                        |
| -------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Couples                    | Coordinate a wedding, track decisions and share tasks        | Own a wedding workspace for guest, budget, task, vendor, schedule and document management                              |
| Professional planners      | Manage client weddings and their own workload                | Work with a couple in the wedding workspace and, over time, manage clients and staff through an organisation workspace |
| Wedding vendors and venues | Present services and handle enquiries or confirmed work      | Maintain a business profile and portfolio, respond to requests and coordinate information for assigned bookings        |
| Guests                     | Respond to invitations and access relevant event information | Use an invitation and RSVP experience, with account-free response intended where appropriate                           |
| Platform operations staff  | Support and oversee a multi-sided service                    | Use administration, verification, support and reporting tools as those operational capabilities are built              |

### Product access principle

The product proposal defines the couple as the wedding owner. An assigned planner is intended to have broad day-to-day management access to that wedding, while ownership actions such as transferring ownership or removing a planner stay with the couple. Vendors and guests should see only information relevant to their relationship with that wedding.

This is the target access model. The current API does not yet implement persisted couple/planner wedding memberships or the full scoped vendor and guest permissions. Those rules must be enforced by the API before shared production access is enabled; hiding controls in the website is not sufficient security.

## Product areas and features

The current web interface includes these product areas:

### Couple and planner wedding workspace

- Wedding overview, progress and upcoming events
- Guest list, search, RSVP status and meal details
- Budget categories and tracked amounts
- Planning tasks, assignments, due dates and completion
- Vendor lists and saved providers
- Timeline and event management
- Seating tables and guest allocation
- Food and drink details
- Documents and related metadata
- Bookings and payment records
- Wedding notes, direct WhatsApp contact and optional event notifications
- Reports and planning analytics

### Marketplace and service providers

- Vendor discovery, search, sorting and category browsing
- Portfolio cards and carousel presentation
- Save or shortlist actions
- Vendor business dashboard showing example bookings, enquiries and performance

The marketplace and business dashboard currently use demonstration content. They should be presented as a product experience under development until real provider profiles, request workflows and booking data are connected.

### Organisation, guest and platform experiences

- Planner organisation overview with example client weddings and team context
- Vendor portal with example enquiries and booking information
- Public invitation and RSVP experience
- Platform administration overview with example health, verification and audit information
- Account settings, language selection and notification preferences

These screens establish the intended workflow and visual direction. A displayed screen or interactive preview does not by itself mean that the corresponding operational service or external delivery provider is live.

### Shared experience

- English and French interface language selection, persisted in a cookie and shared across the application
- Responsive layouts for desktop, tablet and mobile browsers
- Light, dark and system theme options
- Cardo display typography and Nunito interface typography
- Reusable interface components and a consistent wine, blush, sage, gold and neutral palette

## Product value and positioning

### Core value proposition

**Plan the wedding together, with the people and information that matter in one shared workspace.**

### Supporting value themes

- **Clarity:** see what is planned, paid, pending and upcoming.
- **Coordination:** keep tasks, people and event information connected to the wedding.
- **Shared work:** give couples and their chosen planner a common place to coordinate.
- **Service discovery:** help couples explore wedding professionals and portfolios.
- **Guest readiness:** make it easier to collect responses and communicate practical details.
- **Professional growth:** provide a path for planners and providers to manage multiple clients and build a business presence.

### Suggested audience-specific message directions

- **For couples:** “A calmer way to bring your wedding plans together.”
- **For planners:** “Keep every client wedding, task and decision organised in one place.”
- **For vendors:** “Showcase your work and keep booking details connected to the celebration.”
- **For guests:** “Respond to the invitation and find the details you need.”

These are message directions, not validated campaign copy. Marketing should test them with real users and confirm which capabilities are live before using feature-specific promises in paid campaigns or launch materials.

## Business model direction

The proposal describes a potential SaaS model for professional organisations, with staff, multiple managed weddings, reporting and subscription settings. It also identifies a marketplace connecting couples with wedding businesses. These directions may support future organisation subscriptions and marketplace revenue, but pricing, commissions, payment processing, plan limits and commercial terms are not established by the current implementation. Treat monetisation as a product and stakeholder decision, not an existing app capability.

## Current implementation and delivery status

| Area                          | Available now                                                                                                                                   | Boundary to communicate                                                                                                                                                |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Web application               | Responsive Next.js and TypeScript interface, including the product areas listed above                                                           | Many pages use realistic demo records; local browser preview is not evidence of live customers or production readiness                                                 |
| Preview data                  | Editable wedding records persist in browser storage                                                                                             | Data is local to the browser and is not a shared cloud workspace                                                                                                       |
| API                           | Next.js server routes with Better Auth, MongoDB profiles, administration and authenticated workspace record create/read/update/delete endpoints | Workspace records are scoped to the authenticated user, wedding key and module; this is not the complete multi-member access model                                     |
| Workspace modules in API mode | Guests, budget, tasks, vendors, timeline, seating, food and drinks, documents, bookings, payments and notes                                     | These modules currently use a generic workspace-record contract; richer domain workflows and module-specific business rules remain future work                         |
| Language and display          | English/French selection, responsive styling, themes and shared visual system                                                                   | Human review of all translations and accessibility remains part of release preparation                                                                                 |
| Authentication                | Email/password registration and login return a signed token in API mode                                                                         | Email/phone verification, password recovery, social sign-in providers and production-grade session handling still require implementation and configuration             |
| External services             | Interfaces and integration boundaries are documented                                                                                            | Email/SMS/push delivery, object storage and scanning, payment settlement, real-time messaging, calendar sync and SaaS billing are not connected as production services |
| Native mobile app             | None in the current mobile folder                                                                                                               | Mobile access currently means using the responsive web app in a mobile browser                                                                                         |

See [Feature status](FEATURES.md), [Backend integration](BACKEND_INTEGRATION.md) and [Running locally](RUNNING_LOCALLY.md) for implementation details and setup.

## How the system fits together

```text
Couples, planners, vendors and guests
                  |
                  v
     Next.js responsive web application
      |                           |
      | preview mode              | API mode
      v                           v
 Browser storage         Next.js server routes
                                  |
                                  v
                         Relational database
```

The frontend uses a backend adapter so the screens can work with browser preview storage or a compatible API. This boundary is intended to let a future backend replace the current API without embedding backend-specific details throughout the interface. Authentication and workspace requests use the documented HTTP contracts in the frontend and backend integration guides.

## Technology overview for delivery teams

- **Web:** Next.js 16, React 19, TypeScript and Tailwind CSS.
- **UI support:** Lucide icons, React Hook Form and Zod for forms, Sonner notifications, date-fns for dates, Recharts for analytics, Embla for portfolios, next-themes for display preferences, and native `fetch` through the API adapter.
- **API:** Next.js server routes with Better Auth sessions and server-level role checks.
- **Data access:** MongoDB stores Better Auth users, sessions, linked accounts and application workspace records.
- **Quality:** frontend formatting, type checking, build and file-length checks; backend automated tests.

See the repository READMEs for exact environment and startup requirements. Credentials and connection strings belong in local or deployment secret configuration, never in committed documentation or source files.

## Guidance for each team

### Marketing and communications

- Lead with wedding planning coordination and reduced fragmentation.
- Tailor examples to couples, planners, vendors and guests instead of describing one generic user.
- Distinguish live workflows from demonstration screens and planned integrations.
- Do not claim that vendor bookings, payments, notifications, social sign-in or shared planner access are live until their services and security rules are implemented and verified.
- Validate market language, demand, accessibility and English/French translations with users in target markets.

### Product and design

- Treat the wedding as the central planning workspace and preserve couple ownership.
- Define MVP scope and acceptance criteria for each workflow, including error states, permissions and empty states.
- Prioritise the end-to-end journeys: create a wedding, invite/assign collaborators, plan, discover and book services, collect RSVPs, and prepare the event.
- Confirm whether organisation SaaS, guest accounts, vendor access and subscription billing belong in the first release or later phases.

### Engineering

- Keep UI code behind the backend adapter and keep authorization decisions on the server.
- Implement persisted wedding ownership and membership before enabling shared couple/planner use.
- Add scoped organisation, vendor and guest access with negative authorization tests.
- Replace generic workspace JSON records with validated domain contracts as module workflows mature.
- Add secure production sessions, provider integrations, file storage, observability, deployment configuration and end-to-end checks before launch.
- Keep development and production MongoDB credentials and databases separate.

### Stakeholders and operations

- Decide target customer segments, launch geography, supported currencies, service categories and language priorities.
- Set the commercial model, support processes, privacy/retention rules, moderation approach and vendor verification policy.
- Define success measures such as active weddings, planning completion, RSVP response, vendor request conversion, retention and support volume.
- Assign owners and release criteria for the integrations and access controls listed above.

## Decisions still needed before a public launch

1. What is the first release audience: couples, planners, vendors, or a focused combination?
2. Which end-to-end journey is the launch MVP, and which screens remain previews?
3. What is the final access model for couples, planners, vendor staff and guests?
4. Which countries, languages, currencies and legal/privacy requirements are in scope?
5. Will professional subscriptions, marketplace fees or another revenue model be used, and when?
6. Which providers will handle email, SMS, payments, files, notifications and calendar integration?
7. What service targets, support channel and operational controls are required for launch?

## Definition of a launch-ready product claim

Before describing a feature as available, a team should be able to identify its user journey, working interface, server-side rules, data persistence, failure behavior, responsible owner and verification evidence. Until then, describe it as a preview, in development or planned, as appropriate.
