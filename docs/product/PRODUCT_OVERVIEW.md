# Yes Planner stakeholder product overview

Purpose: one evidence-based overview for marketing, product, engineering, design, operations, and business stakeholders.

Source of truth: this describes the yes-planner-web repository inspected on 20 October 2026. The project was previously called Vow Planner; the current product and repository name is Yes Planner. A visible screen is not treated as proof that an underlying service is production-ready.

## 1. Product overview

Yes Planner is a mobile-first web application for planning a wedding and coordinating the people and businesses involved. A Couple can keep wedding information in one workspace, discover wedding professionals, invite guests, manage planning records, and collaborate with an assigned wedding-planning Vendor.

The problem is fragmentation: wedding details commonly live in messages, spreadsheets, documents, booking conversations, and separate vendor websites. Yes Planner is intended to bring planning work, deadlines, guest information, budgets, vendors, communication, and wedding-day information into one controlled workspace.

### Audiences

| Audience                 | Current relationship                                                                                                                                    |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Couples                  | Primary workspace owners who manage a wedding, invite guests, discover businesses, and assign collaborators.                                            |
| Wedding-planning Vendors | Vendor accounts that may offer wedding planning. Access to a wedding requires a Couple's active, wedding-specific assignment.                           |
| Other Vendors            | Businesses such as photographers, caterers, florists, and other providers. Profiles and requests do not grant general wedding access.                   |
| Venues                   | Venue accounts with business profiles and a limited read-only brief when assigned.                                                                      |
| Guests                   | Invitation recipients who submit RSVP data without creating a normal workspace account.                                                                 |
| Platform staff           | Internal users with separate platform roles and permissions for administration, support, verification, operations, finance, or platform administration. |

### Value proposition

> Yes Planner gives couples one calm, shared workspace for the decisions, people, and details behind their wedding.

Supporting statements are product positioning, not validated market claims:

- Couples can organise planning information in one place.
- Wedding professionals can present discoverable business profiles.
- Assigned planners can work inside the specific wedding they support.
- Guests can RSVP without creating a full account.
- Platform staff can operate marketplace and access policies from a controlled administration boundary.

## 2. Product features

### Couple workspace

The current workspace includes guests, RSVP-related data, budgets, tasks, vendors, vendor requests, timeline, seating, tables, food and drinks, documents as records and metadata, bookings, payments, notes, messages, reports, and overview information. API mode uses paginated, server-authorized routes. Demo mode is a browser preview, not a security boundary.

### Marketplace and profiles

Published Vendor and Venue profiles support discovery, search, filtering, profile pages, portfolio browsing, service details, service areas, pricing information, and public profile images. Existing listings can be claimed through an administrator-reviewed workflow. A claim does not grant access to a Couple's wedding.

### Collaboration

Wedding planning is a Vendor service rather than a separate account type. A Couple assigns a Vendor offering that service; the active collaboration is wedding-specific and revocable. A Venue receives a small read-only brief, not general planner access.

### Invitations and RSVP

Guests use invitation links to submit attendance, party, meal, and related responses. Guests are not workspace users by default. Tokens must be treated as private links and responses must stay scoped to the invitation and wedding.

### Authentication and settings

The code supports email/password authentication, optional Google OAuth, optional Instagram OAuth, Better Auth sessions backed by MongoDB, email verification, password reset through Resend, linked-provider visibility, password/session settings, and profile completion. OAuth, email, WhatsApp, and exchange-rate behavior depend on deployment configuration.

### Platform administration

Current staff tools cover platform staff and roles, user metadata, wedding metadata, business and venue directories, claim review, support requests, audit events, and integration testing. Navigation is permission-driven and API routes enforce the same permissions. See PERMISSION_MATRIX.md and PLATFORM_ROLES.md.

### Languages and regional display

The interface supports English and French, responsive navigation, and light/dark/system themes. Fixed UI copy is checked against the French catalog; user-created content is not translated. USD is the stored marketplace base currency. South African traffic can use visible /za routing and display a USD-to-ZAR conversion without rewriting stored values.

## 3. User roles and permissions

| Role                    | Intended access                                                                           | Current backend boundary                                                 |
| ----------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Couple                  | Own and manage its wedding, invite guests, discover businesses, and assign collaborators. | Enforced for owned wedding data and protected workspace routes.          |
| Assigned planner Vendor | Work on the assigned wedding.                                                             | Requires an active collaboration and a Vendor offering wedding planning. |
| Other Vendor            | Handle the allowed service request or limited collaboration.                              | Does not receive general planner access merely because a request exists. |
| Assigned Venue          | Read the wedding brief.                                                                   | Read-only brief; no general workspace or planner access.                 |
| Guest                   | Open an invitation and submit RSVP information.                                           | Token-based public workflow; no internal workspace API access.           |

The proposed model may later include richer venue or organisation operations. The current Venue account is not a persisted organisation with staff membership, spaces, or multi-wedding operations.

Platform staff roles are stored separately from customer account types. Current roles are SuperAdmin, PlatformAdmin, Support, Verification, Operations, and Finance. The server is the final authority; hidden links do not grant or revoke access. SuperAdmin receives currently defined permissions within the System Admin boundary. PlatformAdmin is restricted by protected-role rules. The other roles receive only explicitly mapped permissions. Staff permissions do not grant wedding ownership or future organisation membership.

## 4. Current implementation status

### Functional in API mode

- Couple workspace records and server-authorized CRUD.
- Wedding ownership, collaborator, and planner-access checks.
- Vendor/Venue profile management, marketplace discovery, and claim review.
- Read-only Venue brief.
- Guest invitations and RSVP.
- Better Auth sessions, email/password authentication, linked providers, and optional Google/Instagram OAuth.
- Resend verification, reset-password, and email-test flows when configured.
- Platform staff roles, permission-scoped navigation, protected administration, and audit events.
- English/French catalogs, responsive navigation, themes, /za routing, and display-only currency conversion.
- Public Vendor/Venue profile media in MongoDB GridFS.

### Partial or configuration-dependent

- French coverage is improving; user-created content is not translated.
- OAuth requires provider credentials and exact callback URLs per environment.
- WhatsApp requires Business credentials, phone configuration, approved templates, and opt-in.
- Resend requires a production API key, verified sender, DNS/provider configuration, and correct environment variables.
- Staging browser tests require a staging URL and dedicated test account.
- Demo mode uses browser storage and is not suitable for security or persisted production data.
- Administrative CRUD needs production lifecycle, deletion, audit-context, and recovery policies.

### Planned or deferred

- Venue/larger-business organisations, staff membership, spaces, and multi-wedding operations.
- Subscription billing, entitlements, and marketplace monetisation.
- Private binary wedding document storage and private media access.
- S3-compatible storage, malware scanning, media processing, CDN, retention, and GridFS migration.
- Complete operational support, analytics, and validated commercial measurement.

See FEATURE_MATRIX.md and MEDIA_STORAGE_ROADMAP.md.

## 5. Product messaging and positioning

Yes Planner is a wedding planning and coordination workspace connecting a Couple's planning work with the people and businesses involved in delivering the celebration.

| Audience | Suggested message                                                         | Status                                                        |
| -------- | ------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Couples  | Keep wedding people, decisions, deadlines, and details together.          | Positioning; not market validated.                            |
| Planners | Coordinate inside the specific wedding you have been assigned to support. | Based on implemented access; commercial appeal not validated. |
| Vendors  | Build a discoverable profile and respond to relevant wedding enquiries.   | Product direction; demand not validated.                      |
| Venues   | Present your venue and receive the wedding information your role needs.   | Current brief direction; organisation value not validated.    |
| Guests   | Respond to an invitation without creating a full planning account.        | Current workflow; completion rate not validated.              |

Do not claim organisation operations, paid-plan benefits, private document storage, automated verification, or production-grade media storage until implemented and verified.

## 6. Business model

There is currently no billing provider, subscription record, entitlement check, marketplace commission workflow, or paid-plan enforcement. A business profile is not evidence of a paid plan.

Future opportunities could include a Couple plan, paid organisation plans, staff and multi-event features, venue-space management, reporting, marketplace lead generation, and premium planning services. These are hypotheses. Pricing, packaging, commission, tax, cancellation, and entitlement decisions remain open.

## 7. Technical architecture

    Couples / Vendors / Venues / Guests / Platform staff
                             |
                             v
                  Browser and mobile web interface
                  Next.js pages and React features
                             |
              Same-origin fetch and Better Auth session cookie
                             |
                             v
                 Next.js server pages and versioned API
           authentication -> validation -> authorization
                             |
                             v
                          MongoDB
         Better Auth, profiles, claims, requests, messages,
         workspace items, audit records, and GridFS media

    Optional external services: Resend, Google OAuth, Instagram OAuth,
    WhatsApp Business, and exchange-rate service.

| Layer          | Current implementation                                                                                                                           |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Web            | Next.js 16 App Router, React 19, TypeScript, server-rendered pages, client components, responsive CSS, Tailwind utilities, Lucide, and Recharts. |
| Features       | features/ groups authentication, weddings, marketplace, admin, vendor, guest, messaging, support, settings, and reporting.                       |
| API            | app/api/v1 route handlers authenticate, validate, authorize, and query/update MongoDB.                                                           |
| Authentication | Better Auth with MongoDB-backed users, sessions, and linked accounts; HTTP-only session cookie.                                                  |
| Data           | MongoDB stores application and Better Auth records. Ownership IDs and collaboration records scope wedding access.                                |
| Media          | Public business-profile images use GridFS; private wedding binaries are not implemented.                                                         |
| Data access    | lib/api/client.ts sends browser requests; lib/api/backend.ts selects HTTP API or demo adapter.                                                   |
| Preview        | NEXT_PUBLIC_DATA_SOURCE=demo is browser-only preview; api is persisted mode.                                                                     |
| Validation     | Zod and shared pagination/API error conventions.                                                                                                 |
| Integrations   | Resend, Google/Instagram OAuth, WhatsApp Business, and exchange-rate fetching are optional.                                                      |

References: SYSTEM_OVERVIEW.md, FRONTEND_ARCHITECTURE.md, API_ARCHITECTURE.md, DATA_ARCHITECTURE.md, INTEGRATION_ARCHITECTURE.md, and ENDPOINTS.md.

## 8. Development priorities

1. Confirm the first launch audience and market.
2. Define the minimum Couple workspace for MVP and label or remove non-MVP surfaces.
3. Decide whether guests remain token-only participants and define lost-link recovery.
4. Complete authorization review for every API route, including administrative deletion.
5. Define retention, export, deletion, recovery, and audit policies before production destructive actions.
6. Add request correlation and safe operational context to audit events.
7. Define private document storage and production media handling before accepting sensitive files.
8. Test live, staging, apex, www, and /za routing after origin changes.
9. Add integration tests for Resend, OAuth, WhatsApp, and exchange-rate failures.
10. Establish backups, restore evidence, index monitoring, rate-limit review, and incident ownership.
11. Keep staging and production databases separate and use dedicated browser-test accounts.

## 9. Business and product decisions

- Which market and wedding segment is first?
- Is the Couple experience free, paid, event-limited, or subscription-based?
- Do Vendors pay for visibility, leads, profile features, or subscriptions?
- Are Venues an organisation product or individual profiles in MVP?
- What may each service type do after assignment?
- What exactly may a Venue see in the brief?
- What are the privacy and recovery rules for invitation links?
- Which countries, currencies, languages, tax rules, and payment providers launch first?
- Which integrations are launch requirements?
- What are the privacy, retention, export, and deletion rules?
- Who owns support, verification, moderation, incidents, and account recovery?
- Which metrics define success: active workspaces, completed weddings, RSVP completion, enquiries, retention, or revenue?

## 10. Launch readiness

A feature is not production-ready merely because a page or button exists. Evidence should include:

- a complete user journey on mobile and desktop;
- clear loading, empty, invalid, expired, denied, and provider-failure states;
- complete fixed English and French copy;
- persisted data that survives refresh and navigation;
- consistent ownership and relationship data;
- repeat operations that do not create unintended duplicates;
- server-side authorization for allowed, denied, direct-URL, and crafted-request cases;
- invitation-token privacy and cross-wedding isolation;
- structured, safe audit records where required;
- configured credentials, callback URLs, sender domains, trusted origins, and provider settings;
- health checks, rate limits, monitoring, backups, recovery, and incident ownership;
- staging browser evidence against production-like configuration.

### Readiness conclusion

The repository is a substantial product foundation and a usable development or controlled staging application. It is not, by itself, evidence of broad public-launch readiness. The largest remaining risks concern organisation workflows, commercial entitlements, private files, external-integration verification, operational ownership, recovery policies, and evidence for complete production journeys.

## Related documentation

- Feature matrix: FEATURE_MATRIX.md
- User types: USER_TYPES.md
- Business model: BUSINESS_MODEL.md
- Roadmap: ROADMAP.md
- Local setup: ../development/LOCAL_SETUP.md
- Testing: ../development/TESTING.md
- Script operations: ../operations/SCRIPTS.md
- Security model: ../security/SECURITY_MODEL.md
- Permission matrix: ../security/PERMISSION_MATRIX.md
- Deployment: ../operations/DEPLOYMENT.md
