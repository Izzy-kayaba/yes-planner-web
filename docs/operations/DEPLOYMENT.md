# Deployment

The application is a Next.js service. A production deployment needs:

- `NEXT_PUBLIC_DATA_SOURCE=api`.
- Production MongoDB URI and database name configured in the hosting platform.
- A unique `BETTER_AUTH_SECRET`, the deployment's `NEXT_PUBLIC_SITE_URL`, and matching `BETTER_AUTH_URL`.
- For staging, set `BETTER_AUTH_URL=https://yes-planner-staging.vercel.app` and `NEXT_PUBLIC_SITE_URL=https://yes-planner-staging.vercel.app`. Register `https://yes-planner-staging.vercel.app/api/auth/callback/google` as an authorized Google redirect URI. Do not add `/za` to this callback.
- `NEXT_PUBLIC_API_URL` should be empty when the frontend and API are served by this same Next.js deployment. This avoids redirects during browser preflight requests, including when users arrive through both the apex and `www` domains.
- `BETTER_AUTH_TRUSTED_ORIGINS` containing the live, staging, and any required local origins as a comma-separated list. Set each deployment's `NEXT_PUBLIC_SITE_URL` to its own host so generated links stay on that deployment.
- Verified email sender credentials if email flows are enabled.
- For Resend, set `RESEND_API_KEY` to the production key and `AUTH_EMAIL_FROM` to a sender on a verified Resend domain, for example `Yes Planner <hello@yes-planner.com>`. A sender such as `yessplanner@gmail.com` is a recipient address, not the application sender unless that exact address is accepted by the configured provider.
- OAuth and WhatsApp credentials only when those integrations are enabled.
- Correct production callback URLs at each OAuth provider.

Keep the production database separate from local and staging data. Deployments do not inherit local `.env` files. After changing hosted environment variables, redeploy the application. Verify the health endpoint, authentication, and a read-only role-protected route before running any destructive operation.

Use a staging environment and dedicated test users for browser tests. Do not enable browser-test mutations against real production accounts.
