# Testing

Run the entire local verification sequence with:

```powershell
npm.cmd run test:all
```

The runner prints results for the validation and browser suites. Validation covers formatting, the file-line check, authorization tests, API tests, translation coverage, operations-script argument tests, authentication tests, TypeScript, and a production build.

The local Playwright suite starts a production build in demo mode. It exercises browser-visible product flows but does not prove Better Auth or MongoDB integration. Set `E2E_BASE_URL` for a separately deployed staging target. Staging login and mutations require dedicated test credentials and explicit opt-in variables; never use real customer accounts.

For staging, set `E2E_BASE_URL`; login checks also need `E2E_COUPLE_EMAIL` and `E2E_COUPLE_PASSWORD`. Mutating tests are disabled unless `E2E_ALLOW_MUTATIONS=true`; specific vendor and wedding workflows also need their documented `E2E_VENDOR_ID` and `E2E_WEDDING_ID`. Run against a dedicated staging account and wedding only.

Run an individual suite with `npm.cmd run test:authorization`, `npm.cmd run test:api`, `npm.cmd run test:i18n`, `npm.cmd run test:ops`, `npm.cmd run test:auth`, or `npm.cmd run test:e2e`.
