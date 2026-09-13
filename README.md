# Vow Planner Frontend

This repository contains the mobile-first Next.js frontend for Vow Planner. It is intentionally separate from the ASP.NET Core API in `../VowPlanner`.

## Included experiences

- Premium public landing and authentication pages
- Shared couple and Full Manager wedding workspace
- Guests, budget, tasks, vendors, timeline, seating, menus, documents, bookings, payments, messages, notes and reports
- Planner organisation dashboard
- Vendor marketplace and vendor business dashboard
- Mobile guest invitation and RSVP journey
- Platform administration and account settings
- Responsive light and dark themes
- Central API client, display permission helpers and translation foundation

## Frontend design system

Tailwind CSS owns the shared Vow Planner design tokens and reusable utility styles. The token bridge is defined in `app/globals.css` and covers the wine, blush, sage, gold, blue and neutral palette together with display typography and shadows.

Reusable interface components live in `components/ui`, while wedding-specific components live with the wedding feature. Bespoke CSS is reserved for decorative editorial artwork and complex layouts that are clearer as named visual compositions.

The runtime dependency set is deliberately focused. Next.js and React provide the application structure, while Tailwind CSS owns visual consistency. The supporting libraries each have one defined responsibility:

- `lucide-react` for accessible, consistent interface icons
- `react-hook-form` and `zod` for efficient form state and shared validation rules
- `sonner` for global notifications
- `date-fns` for date formatting and countdown calculations
- `clsx` and `tailwind-merge` for reusable conditional Tailwind classes
- `recharts` for dashboard analytics only
- `embla-carousel-react` for touch-friendly vendor portfolios
- `next-themes` for persistent light, dark and system preferences

HTTP requests continue to use the native `fetch` wrapper in `lib/api/client.ts`; Axios and a general-purpose component library are intentionally not included.

The proposal contains more API modules than the current backend. Those screens use realistic demonstration data so the complete experience can be reviewed now. Replace feature data imports with calls through `lib/api/client.ts` as matching backend endpoints become available. The backend remains the final authority for every permission decision.

## Local development

```powershell
Copy-Item .env.example .env.local
npm.cmd install
npm.cmd run dev
```

Open `http://localhost:3000`. The invitation preview is at `/invite/ruth-and-izzy`.

The default data source is a browser-persisted preview, so the complete workspace can be used without running an API. Set `NEXT_PUBLIC_DATA_SOURCE=api` to use a compatible backend.

## Documentation

- [Folder structure](docs/FOLDER_STRUCTURE.md)
- [Running locally](docs/RUNNING_LOCALLY.md)
- [Backend integration and replacement](docs/BACKEND_INTEGRATION.md)
- [Feature status](docs/FEATURES.md)

## Verification

```powershell
npm.cmd run typecheck
npm.cmd run build
```
