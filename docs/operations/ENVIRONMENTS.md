# Environments

Keep development, staging, and production databases separate. Database scripts require an explicit target:

```powershell
npm.cmd run admin:set -- admin@example.com --env development
npm.cmd run admin:role -- grant Support support@example.com --env development
npm.cmd run media:cleanup -- --env development
npm.cmd run seed:vendors -- --env development
npm.cmd run seed:vendors -- --env staging
```

Choose `--env production` only after verifying the target and taking a backup. The selected target is printed before the script runs. Development scripts read `.env.development.local` / `.env.local`; staging scripts read `.env.staging.local` / `.env.staging`; production scripts read `.env.production.local` / `.env.production`. Shell-provided variables take precedence. Each environment requires its matching `MONGODB_<ENVIRONMENT>_URI` and `MONGODB_<ENVIRONMENT>_DATABASE` variables and never falls back to another environment.

Never commit `.env.local`, `.env.production`, database URIs, OAuth secrets, or provider tokens. In hosted deployments, use the deployment's secret manager. Use `NEXT_PUBLIC_DATA_SOURCE=demo` only for a browser preview; use `api` for persisted server-backed operation.
