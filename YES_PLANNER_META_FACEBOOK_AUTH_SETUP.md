# Yes Planner Meta and Facebook Login setup

This document records the implementation and the configuration that still needs to be completed in Meta. It deliberately contains no application secrets or access tokens.

## Authentication design

Yes Planner keeps email/password, Google, and Instagram authentication in Better Auth. Facebook is an additional provider in the same server-side OAuth callback route:

`/api/auth/callback/facebook`

The browser starts OAuth through `authClient.signIn.social`. Facebook redirects to the server, where Better Auth validates the state value, exchanges the code with Facebook, fetches `/me?fields=id,name,email`, and stores the provider account and session in MongoDB. The Facebook secret and token never enter the browser bundle.

Facebook uses only `public_profile` and `email`. The profile mapper requires Facebook's stable user id. If email is missing, an internal non-deliverable placeholder is used so the identity cannot be mistaken for an email account. Facebook email is not treated as verified unless the provider explicitly returns `email_verified: true`; therefore an unverified matching email is not implicitly linked to an existing account. This preserves the existing user id, roles, subscriptions, and records. Account linking should be performed only from an authenticated security flow after the local email has been verified.

Instagram remains separate and continues to use Instagram Login at `instagram.com/oauth/authorize`, the `api.instagram.com` token endpoint, and `instagram_business_basic`. It is intended for Instagram Business or Creator accounts and does not provide an email address. A missing or unusable Instagram profile id is rejected.

## Environment separation

The deployment supplies the same runtime variable names from separate environment stores. UAT and production must never share values:

| Environment | Meta app               | Site                                     | Facebook callback                                                   |
| ----------- | ---------------------- | ---------------------------------------- | ------------------------------------------------------------------- |
| UAT         | Yes Planner UAT        | `https://yes-planner-staging.vercel.app` | `https://yes-planner-staging.vercel.app/api/auth/callback/facebook` |
| Production  | Yes Planner Production | `https://www.yes-planner.com`            | `https://www.yes-planner.com/api/auth/callback/facebook`            |

Required runtime variables:

```text
FACEBOOK_CLIENT_ID=          # environment-specific Meta App ID
FACEBOOK_CLIENT_SECRET=      # environment-specific Meta App Secret
FACEBOOK_REDIRECT_URI=       # exact callback for that deployment
BETTER_AUTH_URL=             # same public origin as the deployment
NEXT_PUBLIC_SITE_URL=        # same canonical public origin
BETTER_AUTH_SECRET=          # unique high-entropy value per environment
```

The committed `.env.example` contains names only. `.env.staging.local` and `.env.production.local` use placeholders in this checkout; real values belong in the deployment secret manager. The application does not fall back from production to staging or local Facebook credentials.

## Meta applications

Create or use two independent Meta applications:

### Yes Planner UAT

Meta App ID: `3700173263470271`.

Set the app domains to `yes-planner-staging.vercel.app`, configure Facebook Login for the Web platform, and register the exact UAT callback above. Use `https://yes-planner-staging.vercel.app/privacy-policy` and `https://yes-planner-staging.vercel.app/data-deletion` for the UAT legal and deletion URLs. Keep the app in Development mode and add the permitted UAT testers as app roles or test users. Put that app's App ID and App Secret only in the UAT environment.

### Yes Planner Production

Meta App ID: `1138624932197256`.

Set the app domains to `www.yes-planner.com` and `yes-planner.com`, configure Facebook Login for the Web platform, and register only the exact production callback above (plus any explicitly approved canonical alias). Use `https://www.yes-planner.com/privacy-policy` and `https://www.yes-planner.com/data-deletion` for the production legal and deletion URLs. Add brand details and verify the domain. Put that app's App ID and App Secret only in production.

Meta may require business verification, domain verification, App Review, and Advanced Access before production users can use permissions beyond basic profile data. `email` is requested because it is needed for account recovery and collision-safe onboarding; its approval and availability must be confirmed in the production app. Do not claim Live mode or approval until Meta shows those statuses.

## Local setup

Copy the relevant names from `.env.example` into `.env.local`, use a development Meta app or test app, and register:

`http://localhost:3000/api/auth/callback/facebook`

Never use production secrets locally. Start with `npm.cmd run dev`, then open `/login` or `/register`.

## Testing

Code-level checks:

```powershell
npm.cmd run test:auth
npm.cmd run typecheck
npm.cmd run build
```

The mapper tests cover stable identity ids, missing email, and unverified email. A real Meta test still requires a configured App ID/secret, a permitted tester, and the corresponding environment callback. Verify a new Facebook registration, repeat login, cancellation, declined email permission, invalid state, invalid callback, logout, and expired/revoked token handling. Also verify an existing email or Instagram account is not silently merged from an unverified matching email.

## Rollback

Remove the Facebook variables from the affected deployment secret store and redeploy, or set them empty so the provider is not registered. Existing email/password, Google, and Instagram records remain untouched. Do not delete provider account records as a first rollback step.

## Current status

The repository implementation is prepared. The two independent Meta apps have been created and their Facebook Login use cases, minimum permissions, domains, and exact callbacks have been saved. App secrets are intentionally not written here; copy each masked secret into its matching deployment secret store. Meta still reports both apps as ineligible for submission until an app icon, privacy policy URL, and user-data deletion instructions are supplied. Business verification, App Review, Live mode, and real OAuth testing remain pending. Production deployment and live database changes are intentionally not performed by this task.
