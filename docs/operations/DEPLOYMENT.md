# Deployment

The application is a Next.js service. A production deployment needs:

- `NEXT_PUBLIC_DATA_SOURCE=api`.
- Production MongoDB URI and database name configured in the hosting platform.
- A unique `BETTER_AUTH_SECRET`, the deployment's `BETTER_AUTH_URL`, and matching `NEXT_PUBLIC_SITE_URL`.
- `BETTER_AUTH_TRUSTED_ORIGINS` containing the live, staging, and any required local origins as a comma-separated list. Set each deployment's `NEXT_PUBLIC_SITE_URL` to its own host so generated links stay on that deployment.
- Verified email sender credentials if email flows are enabled.
- OAuth and WhatsApp credentials only when those integrations are enabled.
- Correct production callback URLs at each OAuth provider.

Keep the production database separate from local and staging data. Deployments do not inherit local `.env` files. After changing hosted environment variables, redeploy the application. Verify the health endpoint, authentication, and a read-only role-protected route before running any destructive operation.

Use a staging environment and dedicated test users for browser tests. Do not enable browser-test mutations against real production accounts.
