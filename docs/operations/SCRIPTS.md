# Project scripts

This page is the reference for commands exposed by `package.json`. Run commands from the web project root. On Windows, use `npm.cmd`.

## Environment and safety

Database-changing commands require an explicit environment:

```powershell
npm.cmd run <command> -- --env development
npm.cmd run <command> -- --env staging
```

Use `--env production` only after confirming the printed database target and taking a verified backup. Staging commands read `.env.staging.local` or `.env.staging`; production commands read `.env.production.local` or `.env.production`; development commands read `.env.development.local`, `.env.local`, `.env.development`, or `.env`. Never place credentials in this document.

## Application commands

| Command      | How to run               | Purpose                                                                                                |
| ------------ | ------------------------ | ------------------------------------------------------------------------------------------------------ |
| `dev`        | `npm.cmd run dev`        | Starts the Next.js development server.                                                                 |
| `build`      | `npm.cmd run build`      | Creates a production application build.                                                                |
| `build:demo` | `npm.cmd run build:demo` | Runs the production build with browser-only demo data enabled. The end-to-end suite uses this command. |
| `start`      | `npm.cmd run start`      | Starts a previously created production build.                                                          |

## Administration and data operations

| Command         | How to run                                                                      | Purpose and cautions                                                                                                                                                                                                                                                                                                                                          |
| --------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `admin:set`     | `npm.cmd run admin:set -- admin@example.com --env development`                  | Grants the explicit `SuperAdmin` platform role to an existing Better Auth user. It does not create an account.                                                                                                                                                                                                                                                |
| `admin:role`    | `npm.cmd run admin:role -- grant Support support@example.com --env development` | Grants or revokes one platform staff role. Supported roles are `SuperAdmin`, `PlatformAdmin`, `Support`, `Verification`, `Operations`, and `Finance`.                                                                                                                                                                                                         |
| `media:cleanup` | `npm.cmd run media:cleanup -- --env development`                                | Deletes vendor GridFS image files older than 24 hours that are not referenced by a vendor profile. Back up production before use.                                                                                                                                                                                                                             |
| `seed:vendors`  | `npm.cmd run seed:vendors -- --env development`                                 | Upserts seeded vendor profiles from `data.json`, or from a supplied JSON path. Replace `development` with `staging` or `production` only after checking the printed database target. If a record has an explicit `logoSourceUrl`, it downloads and stores the approved JPG, PNG, WebP, or SVG logo as public profile media. Review sources before running it. |

Platform authority now comes only from the stored `platformRoles` array. Do not infer platform access from an account's customer-facing role field.

## Quality and test commands

| Command              | How to run                       | Purpose                                                                                  |
| -------------------- | -------------------------------- | ---------------------------------------------------------------------------------------- |
| `format`             | `npm.cmd run format`             | Formats project files with Prettier.                                                     |
| `format:check`       | `npm.cmd run format:check`       | Checks formatting without changing files.                                                |
| `check:lines`        | `npm.cmd run check:lines`        | Finds tracked source and documentation files over the 1,000-line limit.                  |
| `test:authorization` | `npm.cmd run test:authorization` | Runs route, workspace, wedding-access, and platform-permission tests.                    |
| `test:api`           | `npm.cmd run test:api`           | Runs API contracts, validation, pagination, support, pricing, and metadata tests.        |
| `test:i18n`          | `npm.cmd run test:i18n`          | Checks English/French catalog parity and fixed UI translation coverage.                  |
| `test:ops`           | `npm.cmd run test:ops`           | Tests operational script argument and environment handling.                              |
| `test:auth`          | `npm.cmd run test:auth`          | Tests country validation, Instagram, registration, social registration, and user models. |
| `test:unit`          | `npm.cmd run test:unit`          | Runs all unit test groups above.                                                         |
| `test:e2e`           | `npm.cmd run test:e2e`           | Builds demo mode and runs Playwright browser tests.                                      |
| `test:all`           | `npm.cmd run test:all`           | Runs the full static/unit validation stage and the production-like browser stage.        |
| `typecheck`          | `npm.cmd run typecheck`          | Runs the TypeScript compiler without emitting files.                                     |
| `validate`           | `npm.cmd run validate`           | Runs formatting, line limits, unit tests, type checking, and the production build.       |

## Internal script files

- `scripts/environment.mjs` reads the explicitly selected environment and is used by database commands; it is not a standalone package command.
- `scripts/test-all.mjs` coordinates `validate` and `test:e2e` and reports the combined result.
- `scripts/check-file-lines.mjs` implements `check:lines`.
- `scripts/build-demo.mjs` implements `build:demo`.
- `scripts/set-system-admin.mjs`, `scripts/manage-platform-role.mjs`, `scripts/cleanup-orphaned-media.mjs`, and `scripts/seed-vendors.mjs` implement the operational commands listed above.

### Seeded business logos

Add an explicit HTTPS image URL to a vendor record before seeding:

```json
"logoSourceUrl": "https://example.com/path/to/approved-logo.png"
```

The seed command accepts only JPG, PNG, WebP, or SVG files up to 5 MB. It records the source URL, stores the image in the existing public vendor-media collection, and writes the resulting `/api/v1/media/...` URL into `profileImage`. Re-running the command with unchanged input leaves unchanged records alone and reports them as `Matched without changes`. It does not scrape arbitrary page HTML or use a website favicon automatically. A platform operator must review and approve each direct logo URL before running the seed command.
