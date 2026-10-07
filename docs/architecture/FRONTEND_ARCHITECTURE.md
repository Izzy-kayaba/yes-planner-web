# Frontend architecture

The `app/` tree declares routes and layouts. Product behavior lives in `features/`; reusable controls live in `components/`. Shared API, authentication, localization, permissions, and database code live in `lib/`.

```text
app/          URL routes, page metadata, layouts, API route handlers
components/   shell, providers, form controls, reusable UI
features/     product screens grouped by domain
hooks/        shared client-side state and data loading
lib/api/      backend contract, demo adapter, HTTP client
lib/auth/     authentication helpers and access policy
lib/i18n*     English/French catalogs and request selection
```

Use `useLanguage().text()` for fixed interface copy and add English/French catalog entries together. Use typed keys in `lib/i18n.ts` for grouped, high-level messages. User-created names, notes, and descriptions are data, not interface labels, and should not be machine-translated.

Keep routes thin, centralize repeated behavior in shared helpers, and keep database decisions out of client components. See [coding standards](../development/CODING_STANDARDS.md).
