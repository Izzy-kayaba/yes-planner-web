# API endpoint reference

This page documents the HTTP endpoints implemented in this repository. Unless noted otherwise, protected `/api/v1` requests use the Better Auth session cookie. JSON writes use `Content-Type: application/json`; upload requests use `multipart/form-data`.

The server is authoritative for identity, role, ownership, and collaborator access. Do not send a user ID in place of authentication. Errors use a JSON `message` and an appropriate HTTP status; paginated lists follow [API conventions](API_CONVENTIONS.md).

## Health and regional currency

| Method and path        | Authentication | Purpose                                                                                                                                                                     |
| ---------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/health`      | Public         | Pings MongoDB. Returns `200 { "status": "healthy" }` or `503 { "status": "unavailable" }`. The failure details are written to server logs with connection strings redacted. |
| `GET /api/v1/currency` | Public         | Returns the detected country and whether the visitor is in South Africa. For ZA, it attempts to return a cached USD-to-ZAR rate; unavailable rates are returned as `null`.  |

## Better Auth

| Method and path              | Authentication                       | Purpose                                                                                                                                                                                                                                                                                                            |
| ---------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `GET`, `POST /api/auth/*`    | Depends on the Better Auth operation | Catch-all handler owned by Better Auth. It includes configured session, email/password, OAuth callback, verification, and password-reset operations. The exact subpaths are provided by the configured Better Auth plugins; application code should call `authClient` rather than hard-code provider internals.    |
| `POST /api/v1/auth/register` | Public                               | Creates a Couple, Vendor, or Venue account. JSON fields: `firstName`, `lastName`, `email`, `phoneNumber`, `password`, and `accountType` (legacy `role` is accepted). Requires a valid phone number and allowed self-service role. Returns the Better Auth sign-up response.                                        |
| `GET /api/v1/auth/complete`  | Authenticated browser redirect       | Completes a pending registration intent, sets the selected account type, optionally submits a business-profile claim, clears temporary intent cookies, and redirects to the next page. Redirects to `/login` without a session and can return an account-exists notice for a previously registered Google account. |

## Signed-in account

| Method and path              | Authentication                             | Purpose                                                                                                                                                                                                                 |
| ---------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/v1/me`             | Authenticated; incomplete profiles allowed | Returns the signed-in user's profile, normalized account type, linked sign-in providers, and whether a credential password exists.                                                                                      |
| `PATCH /api/v1/me`           | Authenticated; incomplete profiles allowed | Updates first name, last name, phone number, and WhatsApp notification preference. Validates phone format and rejects a phone number already used by another account.                                                   |
| `POST /api/v1/me/password`   | Authenticated                              | Adds a password only if the account has no credential password. JSON field: `newPassword`; requires at least eight characters, one number, and one symbol. Existing password holders must use the password-change flow. |
| `POST /api/v1/me/email-test` | Authenticated                              | Sends a test email to the current account's email address using the configured email provider. Returns `502` with an explicit delivery error if sending fails.                                                          |

## Wedding profile and workspace

| Method and path                                                           | Authentication                             | Purpose                                                                                                                                                                                               |
| ------------------------------------------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/v1/wedding-profile`                                             | Authenticated                              | Returns the current user's wedding profile and basic profile fields, or `null` if no wedding is configured.                                                                                           |
| `PUT /api/v1/wedding-profile`                                             | Couple account                             | Creates or updates the Couple-owned wedding profile. Validates date, country code, budget, guest estimate, and optional phone number. The server creates a wedding key on first save.                 |
| `GET /api/v1/weddings/{weddingKey}/workspace/{module}?page=1&pageSize=25` | Owner or authorized collaborator           | Returns a paginated list for one supported module. Supported modules: `guests`, `budget`, `tasks`, `vendors`, `timeline`, `seating`, `food-drinks`, `documents`, `bookings`, `payments`, and `notes`. |
| `POST /api/v1/weddings/{weddingKey}/workspace/{module}`                   | Owner/collaborator allowed to create       | Creates a validated workspace record. The server assigns its record ID. Creating a guest also creates a private RSVP token; notification delivery is attempted after the response.                    |
| `PUT /api/v1/weddings/{weddingKey}/workspace/{module}/{recordId}`         | Owner/collaborator allowed to update       | Replaces the record data after module-specific validation. Existing guest invitation tokens are preserved.                                                                                            |
| `DELETE /api/v1/weddings/{weddingKey}/workspace/{module}/{recordId}`      | Owner/collaborator allowed to delete       | Soft-deletes the record by setting `deletedAt`. Returns `204` when successful.                                                                                                                        |
| `GET /api/v1/weddings/{weddingKey}/planner`                               | Authenticated Couple that owns the wedding | Returns active assigned Vendor wedding planners and their public business/contact names.                                                                                                              |
| `DELETE /api/v1/weddings/{weddingKey}/planner`                            | Authenticated Couple that owns the wedding | JSON field: `plannerUserId`. Revokes planner service access for that wedding while preserving any other active service connection.                                                                    |
| `GET /api/v1/connected-vendors?weddingKey={key}`                          | Owner or authorized collaborator           | Returns the business profiles connected to the supplied wedding. The server resolves the wedding owner before listing them.                                                                           |

Workspace list pagination is one-based, defaults to 25 records, and is capped at 100. Unknown modules and inaccessible weddings do not reveal workspace records.

## Public invitations

| Method and path                     | Authentication                      | Purpose                                                                                                                                                                     |
| ----------------------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PATCH /api/v1/invitations/{token}` | Public unguessable invitation token | Saves an RSVP. JSON fields: `response` (`yes` or `no`), optional `mealPreference`, and optional `dietaryNotes`. An attending response must select an available meal option. |

The invitation token is the authorization credential for this limited guest action; it does not grant workspace access.

## Vendor and Venue profiles

| Method and path                          | Authentication                                   | Purpose                                                                                                                                                                                                         |
| ---------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/v1/vendors?page=1&pageSize=25` | Authenticated                                    | Lists published public business profiles in stable business-name order. Returns the shared pagination envelope.                                                                                                 |
| `GET /api/v1/vendor-profile`             | Authenticated                                    | Reads the caller's own business profile or returns `null`.                                                                                                                                                      |
| `PUT /api/v1/vendor-profile`             | Vendor or Venue account                          | Creates or updates the caller's public profile. Validates business fields, service values, price range, and ownership of referenced media. Venue accounts must include Venue and cannot offer Wedding planning. |
| `PUT /api/v1/planner-profile`            | Vendor account                                   | Legacy compatibility route that saves planner-onboarding details into the Vendor profile and adds the Wedding planning service. New clients should use `/api/v1/vendor-profile`.                                |
| `GET /api/v1/vendor-profile/claimable`   | Public                                           | Returns up to 100 public, seeded, unclaimed business listings for the optional registration claim picker.                                                                                                       |
| `POST /api/v1/vendor-profile/claim`      | Vendor or Venue account                          | JSON field: `profileId`. Creates or reuses a pending claim for an eligible unclaimed listing. Pending claims cannot be withdrawn or duplicated for another listing.                                             |
| `POST /api/v1/media`                     | Vendor or Venue account                          | Multipart form field: `file`. Accepts JPG, PNG, or WebP images up to 5 MB, checks their signature, and enforces an upload rate limit. Current storage is MongoDB GridFS.                                        |
| `GET /api/v1/media/{mediaId}`            | Public, for explicitly public profile media only | Streams an image whose stored metadata marks it `public-vendor-profile`. Returns `404` for invalid, missing, or non-public IDs.                                                                                 |
| `DELETE /api/v1/media/{mediaId}`         | The authenticated media owner                    | Deletes only an image whose owner ID matches the current account. Returns `204` on success.                                                                                                                     |

The media API is not a private document-storage API. Production S3-compatible storage and scanning are deferred; see [media storage roadmap](../operations/MEDIA_STORAGE_ROADMAP.md).

## Vendor requests and messaging

| Method and path                                  | Authentication                                     | Purpose                                                                                                                                                                                                                    |
| ------------------------------------------------ | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/v1/vendor-requests?page=1&pageSize=25` | Couple, Vendor, or Venue                           | Returns requests sent by the Couple or addressed to the business account, depending on caller role.                                                                                                                        |
| `POST /api/v1/vendor-requests`                   | Couple account                                     | Sends a work request. JSON fields: `vendorUserId`, `service`, and optional `message`. Requires a saved wedding profile and a published business offering that service. Planner assignments are limited to Vendor accounts. |
| `PATCH /api/v1/vendor-requests/{requestId}`      | Vendor or Venue account addressed by the request   | JSON field: `status` (`Accepted` or `Declined`). Acceptance creates/updates a wedding-specific collaboration. A Venue cannot accept a Wedding planning assignment.                                                         |
| `GET /api/v1/messages?page=1&pageSize=25`        | Couple, Vendor, or Venue                           | Without conversation parameters, returns the caller's accepted conversations. Add both `participantUserId` and `weddingKey` to return that conversation's message history; both parameters are required together.          |
| `POST /api/v1/messages`                          | Couple, Vendor, or Venue in an accepted connection | Sends JSON `{ "recipientUserId": "...", "weddingKey": "...", "body": "..." }`. A work request must be accepted before messages can be sent.                                                                                |
| `PATCH /api/v1/messages`                         | Couple, Vendor, or Venue                           | Marks incoming messages in a conversation as read. JSON fields: `participantUserId` and `weddingKey`.                                                                                                                      |

## System administration

| Method and path                                      | Authentication | Purpose                                                                                                                                                                                    |
| ---------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `GET /api/v1/admin/users?page=1&pageSize=25`         | System Admin   | Returns a paginated user list with the fields needed by the administration screen.                                                                                                         |
| `GET /api/v1/admin/vendor-claims?page=1&pageSize=25` | System Admin   | Returns a paginated list of pending claims enriched with claimant contact information.                                                                                                     |
| `PATCH /api/v1/admin/vendor-claims`                  | System Admin   | JSON fields: `claimId` and `status` (`Approved` or `Declined`). Approval attaches or merges the seeded business listing into the claimant's existing profile and marks the claim reviewed. |

Administrative endpoints never accept the requested account role as proof of System Admin permission.
