# SkynexiaDM Monorepo

Digital marketing operations platform built as a Turborepo monorepo.

The primary product is `apps/dm` (client operations dashboard), with `apps/admin` used as a lightweight UI playground for shared components.

## What This Repository Contains

- `apps/dm`: Main Next.js application (port `3152`) with App Router pages, APIs, auth, and MongoDB models.
- `apps/admin`: Secondary Next.js application (port `3153`) for UI/package validation.
- `packages/ui`: Shared React UI package consumed by both apps.
- `packages/eslint-config`: Shared linting rules.
- `packages/typescript-config`: Shared TypeScript configs.

## Tech Stack

- **Runtime:** Node.js `>=18`, pnpm `9`, Turborepo `2`
- **Frontend:** Next.js `16` (App Router), React `19`, TypeScript
- **Styling:** Tailwind CSS, Radix UI, utility components in `components/ui`
- **Backend:** Next.js Route Handlers, MongoDB + Mongoose
- **Validation / Utilities:** Zod, date-fns, nodemailer, twitter-api-v2

## Monorepo Structure

```text
skynexiaDM/
├── apps/
│   ├── dm/                         # Main digital marketing dashboard
│   │   ├── app/                    # Next.js routes (pages + /api handlers)
│   │   ├── components/             # Domain and shared UI components
│   │   ├── lib/                    # Auth, API helpers, integrations, utilities
│   │   ├── models/                 # Mongoose schemas/models
│   │   ├── hooks/                  # Custom hooks
│   │   ├── scripts/                # Utility scripts (e.g. seed user)
│   │   ├── types/                  # Shared TypeScript app types
│   │   ├── proxy.ts                # Edge auth middleware/proxy
│   │   └── .env.example            # Environment variable template
│   └── admin/                      # UI playground app
│       └── app/                    # Minimal app routes
├── packages/
│   ├── ui/                         # Shared component package
│   ├── eslint-config/              # Shared ESLint config
│   └── typescript-config/          # Shared tsconfig presets
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

## `apps/dm` Detailed Module Map

### App Router Areas (`apps/dm/app`)

Main route groups currently include:

- `dashboard` (largest section; dashboards, reviews, clients, team, docs)
- `clients`, `campaigns`, `channels`, `content`, `leads`, `reviews`
- `settings`, `tasks`, `team`, `time-tracking`, `reports`, `posts`
- `integrations`, `analytics`, `connect-wall`, `invoices`, `seo`
- `help`, `portal`, `admin`, `login`, `welcome`
- `api` (server route handlers)

### API Surface (`apps/dm/app/api`)

The app currently contains **135** route handlers, including domain groups such as:

- `auth`, `users`, `team`, `roles`, `assignments`, `performance`
- `clients`, `campaigns`, `leads`, `tasks`, `time-entries`
- `reviews`, `review-drafts`, `review-allocations`, `review-analytics`, `review-requests`, `review-usage`
- `scheduled-posts`, `social/status`, `content-bank`, `google-reviews`
- `integrations`, `webhooks`, `portal`, `notifications`
- `dashboard/stats`, `analytics`, `search`, `export/*`, `cron/*`
- `files`, `settings/*`, `email/send`, `invoices`, `seo/rank-gap`

### Components (`apps/dm/components`)

Component domains currently available:

- `ui` (12 base UI components): `button`, `card`, `dialog`, `input`, `select`, `sheet`, `table`, `tabs`, etc.
- `reviews` (20 files): review workflows, tables, draft and allocation UIs
- `team` (9 files): member/role/workload-related UI
- `dashboard` (9 files): layout/navigation/dashboard widgets
- `settings` (5 files), `scheduled-posts` (5 files), `global-search` (3 files)
- Additional domains: `access`, `admin`, `campaigns`, `clients`, `connect-wall`, `contact-book`, `content`, `google-reviews`, `leads`, `review-analytics`, `review-requests`, `review-templates`, `saved-filters`, `seo`, `social`, `tasks`

Notable top-level components include:

- `dashboard-layout.tsx`, `dashboard-nav-links.tsx`, `mobile-dashboard-nav.tsx`, `sidebar.tsx`
- `global-search.tsx`, `notification-bell.tsx`, `theme-toggle.tsx`
- Domain forms such as `client-form.tsx`, `campaign-form.tsx`, `review-form.tsx`, `task-form.tsx`

### Data Models (`apps/dm/models`)

Available model files include:

- Marketing/CRM: `Client`, `Campaign`, `Lead`, `Task`, `Keyword`, `Competitor`
- Reviews: `Review`, `ReviewDraft`, `ReviewAllocation`, `ReviewUsage`, `ReviewRequest`, `PostedReview`
- Team/Auth: `User`, `TeamMember`, `TeamRole`, `TeamAssignment`, `TeamActivityLog`
- Publishing/Content: `ContentItem`, `ScheduledPost`, `PostMetrics`, `Template`, `ExternalReview`
- Finance/Operations: `Invoice`, `ItemMaster`, `TimeEntry`, `BudgetAlert`, `ReportSchedule`
- Integrations/System: `Integration`, `IntegrationEvent`, `Webhook`, `Notification`, `FileAsset`, `WallMessage`

## Features Available

### Core Product Features

- Authentication and session-based access control (edge + API-level checks)
- Client, campaign, lead, task, and team management workflows
- Review lifecycle management:
  - Draft creation/import
  - Allocation and assignment
  - Used/posted/shared tracking
  - Analytics and history
- Scheduled content posting and social publishing flows
- Integrations, webhooks, portal approval/comment flows
- Dashboards, reporting, filtering, exports (CSV/PDF/data packages)
- Notifications, contact-book utilities, global search, and role-aware navigation

### Operational Features

- Cron-driven jobs (budget pacing checks, report sending, scheduled post publishing, post metric sync)
- Email delivery abstraction (`none` / `resend` / `smtp`)
- AI-assisted content endpoint (`/api/ai/generate-content`) with provider fallback logic
- Per-domain APIs for data admin and analytics

## Scripts and Commands

### Root (`package.json`)

- `pnpm dev` -> runs `dm` app in dev mode via Turbo
- `pnpm dev:admin` -> runs `admin` app in dev mode
- `pnpm build` -> production build across workspaces
- `pnpm lint` -> lint all workspaces
- `pnpm check-types` -> type checks all workspaces
- `pnpm format` -> Prettier for `ts/tsx/md`

### `apps/dm`

- `pnpm --filter dm dev` -> Next dev on `3152`
- `pnpm --filter dm build` -> production build
- `pnpm --filter dm start` -> serve production build on `3152`
- `pnpm --filter dm seed:user` -> seed/update an initial user

### `apps/admin`

- `pnpm --filter admin dev` -> Next dev on `3153`
- `pnpm --filter admin build`
- `pnpm --filter admin start`

## Environment Variables (`apps/dm/.env.local`)

Start from `apps/dm/.env.example`.

### Required for local baseline

- `MONGODB_URI`
- `AUTH_SECRET`
- `PORT` (default `3152`)
- `NEXT_PUBLIC_API_URL`

### Optional capability flags

- AI: `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`
- Email: `EMAIL_PROVIDER`, plus `RESEND_*` or `SMTP_*`
- Google reviews import: `GOOGLE_PLACES_API_KEY`
- Social publishing: `FACEBOOK_*`, `INSTAGRAM_*`, `LINKEDIN_*`, `TWITTER_*`

## Getting Started

```bash
pnpm install
cp apps/dm/.env.example apps/dm/.env.local
pnpm dev
```

Open:

- DM app: [http://localhost:3152](http://localhost:3152)
- Admin app (if running `pnpm dev:admin`): [http://localhost:3153](http://localhost:3153)

## Build, Lint, Typecheck

```bash
pnpm lint
pnpm check-types
pnpm build
```

## Notes for Contributors

- Keep shared primitives in `packages/ui` where possible.
- Add domain UI in `apps/dm/components/<domain>`.
- Add/extend API handlers in `apps/dm/app/api`.
- Keep schema updates aligned between `apps/dm/models` and `apps/dm/types`.
- If adding new integration or cron behavior, document env vars in `apps/dm/.env.example` and feature docs in `apps/dm/README.md`.
