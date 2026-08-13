# Budget

**A personal-budget dashboard on top of a Google Sheet — KPIs, charts, filters, and history in two currencies.**

[Русская версия](README.md)

## Why

The budget lives in a Google Sheet — great for input (by hand or via a Telegram bot message), poor for analytics: formulas are fragile, slices are limited, past months drown. Budget keeps the sheet as the single place of input and takes over everything else: data syncs automatically into Postgres, and a fast dashboard with filters, charts, and currency conversion runs on top — you never have to open the sheet again.

Two core points: **(1)** the sheet stays the source of truth and is never written to, **(2)** all analytics live on the site, behind a login.

## Features

- **Google Sheets sync** — a service account reads the `Операции` (operations), `Категории` (categories), and `Курсы` (rates) sheets and fully reloads them into Postgres in a single transaction: every 10 minutes automatically, or on demand via a protected API call; the last sync's status (time, row counts, errors) is shown on the dashboard.
- **Period KPIs** — income, expenses, and balance for the selected date range, with semantic colors and tabular numerals.
- **Daily dynamics** — an area chart of income vs. expenses across the period.
- **Expenses by category** — a donut chart (top 8 + "Others") with a legend showing each category's share and total.
- **Filters** — period presets (current month / 30 days / all time), custom dates, type (income/expense), category, and text search over descriptions; all state lives in the URL, so any slice is shareable as a link.
- **Operations table** — date, category, description, and signed amount, paginated.
- **Sum/USD toggle** — the whole screen (KPIs, charts, legend, table) is converted at the latest rate from the rates sheet.
- **Login** — a single user defined by environment variables and seeded idempotently on every deploy; rotating the secret rotates the password.

## Stack

Next.js 15 (App Router, standalone) + TypeScript + Prisma/PostgreSQL + Tailwind v4 + Recharts + NextAuth v5, deployed as Docker containers on a self-managed VM behind Caddy. Details in [ARCHITECTURE.md](ARCHITECTURE.md).

## Running locally

```sh
cp .env.example .env   # fill in real values (DB, service-account key, spreadsheet id)
npm install
docker run -d --name budget-db -e POSTGRES_USER=budget -e POSTGRES_PASSWORD=budget \
  -e POSTGRES_DB=budget -p 5432:5432 postgres:16-alpine
npx prisma migrate deploy
node scripts/seed-user.mjs
npm run dev
```

The app comes up at `http://localhost:3000`.

## Production

**[budget.oresh.in](https://budget.oresh.in)**

## For developers

- **[ARCHITECTURE.md](ARCHITECTURE.md)** — stack, source layout, the sync pipeline, key decisions.
- **[CONTRIBUTING.md](CONTRIBUTING.md)** — how to build, run, add a feature, deploy; project conventions.

## Security

Secrets live only in `.env` (never in code or commits); in production the `.env` is rendered at deploy time from a self-hosted secrets store (Infisical). The Google service-account key is passed as an environment variable (base64) — no key file is mounted. The login password is stored as a bcrypt hash; the sync API is protected by a Bearer token. More in [CONTRIBUTING.md](CONTRIBUTING.md).

## Status

v1 in production: sync, auth, aggregations, dashboard, auto-deploy. Next: month-over-month trends, AI spending review, limits and forecasting.
