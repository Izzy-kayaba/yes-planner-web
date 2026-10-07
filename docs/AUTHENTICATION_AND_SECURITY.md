# Authentication, MongoDB and access control

Yes Planner uses Better Auth inside the Next.js server. Better Auth stores users, linked OAuth accounts and sessions in MongoDB. Application workspace records use the same selected MongoDB database in a separate `workspaceItems` collection.

## Environment separation

Development reads:

```dotenv
MONGODB_DEVELOPMENT_URI=mongodb://127.0.0.1:27017
MONGODB_DEVELOPMENT_DATABASE=yes_planner_development
MONGODB_USE_TRANSACTIONS=false
```

Production requires `MONGODB_PRODUCTION_URI` and `MONGODB_PRODUCTION_DATABASE`. Production credentials must point to a separate database or cluster and must be set in the deployment secret manager. The application refuses to start in production when either value is absent.

A standalone local MongoDB server cannot group several writes into one database transaction. Keep `MONGODB_USE_TRANSACTIONS=false` for that setup. MongoDB Atlas and replica-set deployments support transactions; production enables them by default, or they can be selected explicitly with `MONGODB_USE_TRANSACTIONS=true`.

Set a unique high-entropy `BETTER_AUTH_SECRET` and the public application URL in `BETTER_AUTH_URL` for each environment.

## Login methods

- Email and password
- Google OAuth
- Instagram OAuth through Better Auth's Generic OAuth provider

Register these local callback URLs with the providers:

```text
http://localhost:3000/api/auth/callback/google
http://localhost:3000/api/auth/callback/instagram
```

Use the matching HTTPS application domain in production. Google requires a Google Cloud OAuth client. Instagram requires an application with the appropriate Instagram OAuth product and permissions. Credentials are external secrets; the code is ready to run when valid credentials and provider-side callback URLs are configured.

Instagram does not provide an email address through this profile flow. Better Auth requires one on every user record, so the integration stores a non-routable address under the reserved `.invalid` domain and anchors the identity to Instagram's stable account identifier. The user can maintain their real contact information separately in Yes Planner.

## Phone numbers

Phone numbers are required before any authenticated business API can be used. Email/password registration captures and normalises the number immediately; social sign-in users are redirected to profile completion. Stored numbers use international E.164 format so eligible vendor profiles can expose a WhatsApp contact action without maintaining a second phone representation.

Password recovery uses Better Auth's one-hour reset tokens and revokes existing sessions after a successful reset. Reset messages are delivered through the configured Resend account using `RESEND_API_KEY` and `AUTH_EMAIL_FROM`.

WhatsApp event delivery is optional and requires `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` and an approved `WHATSAPP_NOTIFICATION_TEMPLATE` containing one body variable. It is disabled when those values are absent. A validated phone number alone is not consent: notifications are sent only after the user enables WhatsApp notifications in account settings.

Registration and profile settings use `react-phone-number-input` and `libphonenumber-js`. The UI provides country codes and formatting. Both client and server validate the number, and MongoDB stores its normalized E.164 form.

## Account types, services and enforcement

The primary account types are:

- `Couple`
- `Venue`
- `Vendor`
- `Guest`

Public registration accepts Couple, Vendor and Venue. Guests normally enter through an invitation, while `SystemAdmin` is a protected administrative permission rather than a normal account choice. A System Admin is promoted with an explicit database administration command after the account has registered:

```powershell
node --env-file=.env.local scripts/set-system-admin.mjs admin@example.com
```

The System Admin dashboard and `/api/v1/admin/*` endpoints require `SystemAdmin`. Wedding workspace endpoints validate the Better Auth session, role, allowed module and record ownership on every request. A hidden frontend control is never treated as authorization.

Business services are stored separately on the business profile. A wedding planner is therefore a Vendor whose services include `Wedding planning`; photography, floristry and the other categories are services rather than user roles. A Venue has its own account type and may also list Venue, Catering, Decor or other supported services.

Current wedding policy:

- System Admin and the owning Couple can use all wedding workspace modules.
- A Vendor offering Wedding planning becomes eligible for management, but receives no wedding access automatically.
- When a couple's Wedding planning request is accepted, that business receives `FullManager` access to that wedding only.
- A Vendor connected for another service receives limited Vendor access to that wedding.
- Guest cannot use internal wedding workspace APIs.

The wedding remains owned by the Couple. The `weddingCollaborators` collection records the business's relationship and services separately for each wedding.

## Wedding onboarding and dashboard data

Couple accounts must complete their own wedding profile before opening wedding-dependent dashboard tools. The profile stores the partner name, couple display name, wedding date, venue and location in the `weddingProfiles` collection. Every record is keyed to the user ID taken from the authenticated server session.

Authenticated dashboard summaries are assembled on the server from the current user's MongoDB records. Demo values are used only when `NEXT_PUBLIC_DATA_SOURCE=demo`. API mode renders a route loading state while real data is being retrieved and never initializes workspace collections with demo records.

The former generic internal Messages workspace is not presented as a real-time chat system because it did not provide WebSocket delivery, presence or delivery state. Users can contact vendors directly on WhatsApp. Users may separately opt in to approved-template WhatsApp notifications for vendor-request decisions and shared-workspace changes.

Vendor and Venue accounts complete a business profile containing business details, supported services, service area, starting price and portfolio media. Published profiles are searchable by authenticated platform users. Portfolio uploads accept JPG, PNG and WebP images smaller than 5 MB, with at most six work images per profile. Image bytes are stored separately from profile documents in MongoDB GridFS, and profiles contain only controlled media URLs. Upload and deletion require the business owner's authenticated session; published portfolio reads use unguessable media identifiers and strict content types. Run `npm run media:cleanup` on a daily schedule to remove uploads older than 24 hours that were never attached to a saved business profile.

Existing Planner users are migrated to Vendor accounts with the Wedding planning service. The migration also copies their legacy `plannerProfiles` details into `vendorProfiles`. Run `npm run migrate:user-model` once for each existing database after taking a backup. The runtime still recognises an unmigrated Planner session as a Vendor during the transition.

Couples send vendor requests through `/api/v1/vendor-requests`. Only the selected vendor can accept or decline a request. Acceptance creates an active wedding collaboration. The vendor can then read only the permitted parts of that wedding workspace and can write only within messaging; every access check is repeated by the server.

## API routes

```text
/api/auth/*
/api/health
/api/v1/auth/register
/api/v1/auth/complete
/api/v1/me
/api/v1/wedding-profile
/api/v1/vendor-profile
/api/v1/planner-profile (legacy compatibility)
/api/v1/vendors
/api/v1/media
/api/v1/media/{mediaId}
/api/v1/vendor-requests
/api/v1/vendor-requests/{requestId}
/api/v1/weddings/{weddingKey}/workspace/{module}
/api/v1/weddings/{weddingKey}/workspace/{module}/{recordId}
/api/v1/admin/users
```

Browser requests use secure Better Auth session cookies. Application code does not store long-lived access tokens in browser storage.
