# Production troubleshooting

## Current finding

`https://yes-planner-web.vercel.app/api/health` reaches Vercel but returns HTTP `503` with `{"status":"unavailable"}`. The health route returns that response only when MongoDB cannot be reached or authenticated. The application domain and route are therefore working; the current production blocker is the database connection.

The local production-database test also reached the connection layer but Node reported `unable to verify the first certificate`. This can be caused by a company antivirus, proxy or network filter replacing the certificate chain. Do not work around it with `tlsAllowInvalidCertificates=true` or by disabling TLS verification.

## Important environment-file distinction

Next.js loads `.env`, `.env.local`, `.env.production` and `.env.production.local`. It does not load a file named `env.local` without the leading dot. The repository ignores both forms so secrets cannot accidentally be committed.

Local files are not copied into Vercel. Every required value must also exist in the Vercel project's Production environment.

## Investigation order

1. Open the Vercel project, then **Settings → Environment Variables**.
2. Confirm these variables exist for the **Production** environment:
   - `MONGODB_PRODUCTION_URI`
   - `MONGODB_PRODUCTION_DATABASE`
   - `BETTER_AUTH_SECRET`
   - `BETTER_AUTH_URL`
   - `NEXT_PUBLIC_DATA_SOURCE=api`
   - `NEXT_PUBLIC_API_URL=https://yes-planner-web.vercel.app`
3. Ensure `BETTER_AUTH_URL` exactly matches the HTTPS production domain, without an unrelated path.
4. Redeploy after changing variables. Existing deployments do not automatically receive newly added values.
5. Request `/api/health` and inspect the matching function invocation under **Vercel → Logs**. The health route records the MongoDB error name, code and sanitised message without returning credentials to the browser.
6. In MongoDB Atlas, check **Database Access** and confirm the username in the URI exists and has access to the configured production database.
7. In Atlas **Network Access**, permit the application's outbound traffic. Standard Vercel deployments do not provide one fixed outbound IP unless a static-egress product is configured. For a short diagnostic, an Atlas entry of `0.0.0.0/0` can confirm an allow-list problem, but use a strong database password and replace this with an appropriate production network strategy.
8. If the database password contains characters such as `@`, `:`, `/`, `?`, `#` or `%`, URL-encode the password before placing it in the MongoDB URI.
9. Confirm the Atlas cluster is running and that the URI uses the current cluster hostname.

## Safe checks

Run these one at a time from `yes-planner-web`:

```powershell
npm.cmd run typecheck
```

```powershell
npm.cmd run check:lines
```

```powershell
npm.cmd run format:check
```

```powershell
npm.cmd run build
```

Check the deployed database health:

```powershell
curl.exe -i https://yes-planner-web.vercel.app/api/health
```

A working result is HTTP `200` with `{"status":"healthy"}`. HTTP `503` means the deployed function still cannot use MongoDB.

## Local certificate failure

If the same certificate error occurs on another unrestricted network, export the trusted organisation root certificate and point Node to it with `NODE_EXTRA_CA_CERTS`. Do not commit the certificate path or certificate into this repository. If the connection works on another network, inspect antivirus HTTPS scanning or the current network proxy certificate chain.

## External providers still requiring credentials

Instagram sign-in cannot work until `INSTAGRAM_CLIENT_ID` and `INSTAGRAM_CLIENT_SECRET` are configured locally and in Vercel. WhatsApp notifications also require `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID`. The current email sender value should be replaced with a verified production sender before testing password-reset delivery.
