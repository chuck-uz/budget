# Contributing / Development guide

How to build, run, and extend Budget. For the system design read
[ARCHITECTURE.md](ARCHITECTURE.md); for product usage read [README.md](README.md).

## Prerequisites

- Node.js 22+ and npm.
- Docker (for the local Postgres, and to reproduce the production build).
- A Google Cloud service account with **read-only** access to the budget
  spreadsheet (share the sheet with the SA's email). Key supplied via
  `GOOGLE_SA_JSON_FILE` (path, local dev) or `GOOGLE_SA_JSON_B64` (base64,
  production).

## Project layout

```
src/app/          pages + API routes (dashboard RSC, login, /api/sync, /api/dashboard)
src/lib/          business logic — pure functions first, wrappers second
src/components/   dashboard UI (Recharts charts, filters, table)
prisma/           schema + migrations
scripts/          idempotent admin-user seed
Dockerfile        multi-stage production image (standalone output)
docker-compose.prod.yml   production stack: db + one-shot migrate + app
```

See [ARCHITECTURE.md § 3](ARCHITECTURE.md#3-source-layout) for the full map.

## Build & run

```sh
cp .env.example .env      # fill in real values
npm install
docker run -d --name budget-db -e POSTGRES_USER=budget -e POSTGRES_PASSWORD=budget \
  -e POSTGRES_DB=budget -p 5432:5432 postgres:16-alpine
npx prisma migrate deploy
node scripts/seed-user.mjs        # reads ADMIN_EMAIL / ADMIN_PASSWORD from .env
npm run dev
```

The app comes up at `http://localhost:3000`. The first sync fires ~5 s after
boot (needs `SYNC_TOKEN` set); trigger one manually with:

```sh
curl -X POST -H "Authorization: Bearer $SYNC_TOKEN" http://localhost:3000/api/sync
```

Tests and the production build:

```sh
npm test              # vitest — pure-function suites (money, filters, …)
npm run build         # prisma generate + next build (standalone)
```

## Adding a feature — the usual shape

1. **Business logic** as a pure function in `src/lib/` — parsing, filtering,
   math take plain data in and return plain data out (see `parse.ts`,
   `filters.ts`, `money.ts`). Prisma/Sheets calls stay in thin wrapper modules
   (`sync.ts`, `analytics.ts`, `sheets.ts`).
2. **Test first** for the pure part: write the colocated `*.test.ts`, watch it
   fail, implement until green. Thin DB/API wrappers are not unit-tested —
   they are verified against live data instead.
3. **Page/route** — the dashboard is a single RSC (`app/page.tsx`) reading
   typed filters from the URL; new views follow the same pattern. Mutating
   endpoints are Route Handlers with explicit auth (session via `auth()` or
   `SYNC_TOKEN` Bearer).
4. **UI** — match the fixed dark theme (`bg-white/5`, `border-white/10`
   surfaces), `tabular-nums` for figures, the palette in `lib/ui.ts`, 44px+
   touch targets, mobile-first grid.
5. **Verify in a browser** before calling it done — desktop and mobile
   viewport, empty states, and the Сум/USD toggle across the whole screen.
6. Commit in small, meaningful steps. Pushing to `main` deploys to production
   (see below), so push when the change is actually done.

## Testing conventions

Vitest, colocated `*.test.ts` files, pure functions only. Aggregations
(`analytics.ts`) are validated against the live sheet by comparing totals with
the spreadsheet's own numbers rather than mocked in unit tests. UI changes are
verified manually in a real browser.

## Deploying

Production runs on a self-managed VM behind a shared Caddy proxy, at
[budget.oresh.in](https://budget.oresh.in).

**Pushing to `main` is enough.** A GitHub webhook triggers the VM's deploy
script, which does: `git pull` → render `.env` from the Infisical secrets
store (project `budget`, environment **Production** — secrets in other
environments are invisible to deploys) → `docker compose -f
docker-compose.prod.yml up -d --build`. Migrations run as a one-shot `migrate`
service before the app starts; the admin user is re-seeded from
`ADMIN_EMAIL`/`ADMIN_PASSWORD` on every start, so rotating the password secret
rotates the login.

After pushing, give the build a couple of minutes, then check
`https://budget.oresh.in` and, if needed, the container logs on the VM
(`docker logs budget-app-1`).

## Conventions

- Product-facing text (UI copy) is in Russian; identifiers and code comments
  in English or Russian matching the surrounding file. Developer docs (this
  file, `ARCHITECTURE.md`) are in English; `README.md` has a Russian original
  and an English translation.
- Small, frequent commits over one big commit per task.
- Secrets only in `.env` (gitignored) or Infisical — never in code or commit
  history. The spreadsheet id in `.env.example` is a placeholder; the sheet
  itself is private and shared only with the service account.
