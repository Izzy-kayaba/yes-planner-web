# Environments

Keep development and production databases separate. Database scripts require an explicit target:

```powershell
npm.cmd run admin:set -- admin@example.com --env development
npm.cmd run admin:role -- grant Support support@example.com --env development
npm.cmd run migrate:user-model -- --env development
npm.cmd run media:cleanup -- --env development
npm.cmd run seed:vendors -- --env development
```

Choose `--env production` only after verifying the target and taking a backup. The selected target is printed before the script runs. Scripts read `.env.development.local` / `.env.local` for development and `.env.production.local` / `.env.production` for production; shell-provided variables take precedence. Production scripts require the dedicated `MONGODB_PRODUCTION_URI` and `MONGODB_PRODUCTION_DATABASE` variables and never fall back to development credentials.

Never commit `.env.local`, `.env.production`, database URIs, OAuth secrets, or provider tokens. In hosted deployments, use the deployment's secret manager. Use `NEXT_PUBLIC_DATA_SOURCE=demo` only for a browser preview; use `api` for persisted server-backed operation.
