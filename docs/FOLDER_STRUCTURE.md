# Frontend folder structure

Vow Planner groups code by product area. A page chooses a feature; it does not contain the feature implementation itself.

```text
VowPlanner-UI/
├── app/                         Next.js routes, layouts and global style entry points
│   ├── (auth)/                  Login and registration routes
│   ├── (dashboard)/             Authenticated SaaS routes
│   ├── invite/[token]/          Public guest RSVP route
│   └── styles/                  Small CSS modules grouped by experience
├── components/
│   ├── forms/                   Shared form and search building blocks
│   ├── i18n/                    Language selector
│   ├── layout/                  Application shell and navigation
│   ├── providers/               Language, theme and notification providers
│   └── ui/                      Reusable visual components
├── features/
│   ├── auth/                    Authentication UI and validation
│   ├── dashboard/               Couple dashboard
│   ├── guests/                  Public RSVP experience
│   ├── marketplace/             Vendor discovery and portfolios
│   ├── reports/                 Lazily loaded analytics charts
│   ├── settings/                Account and language settings
│   └── weddings/sections/       One component per wedding module
├── hooks/                       Reusable React state and data hooks
├── lib/
│   ├── api/                     Backend-neutral contract and adapters
│   ├── cn.ts                    Tailwind class composition
│   ├── demo-data.ts             Initial preview records
│   ├── i18n.ts                  English and French messages
│   └── permissions.ts           Display-level permission helpers
├── scripts/                     Repository quality checks
└── types/                       Shared frontend domain types
```

## Placement rules

- Keep route files thin. Put interactive behavior in `features/`.
- Keep reusable visual controls in `components/ui` or `components/forms`.
- Put backend-specific code only in `lib/api`.
- Add English and French text together in `lib/i18n.ts`.
- The selected language lives in `LanguageProvider` and is saved for one year in the
  `NEXT_LOCALE` cookie. The root layout reads that cookie before rendering, validates it against
  the supported languages, and sets the document language without a client-side language flash.
- Split a file before it reaches 1,000 formatted lines.
- Run `npm run format` and `npm run check:lines` before committing.

The line check ignores generated dependencies and the lock file. It checks maintained TypeScript, CSS, JavaScript and Markdown files.
