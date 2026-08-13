# Budget — Architecture

Technical documentation for developers. It explains how the app is structured,
how the sync pipeline works, and the design decisions behind it. For
product/usage docs see [README.md](README.md); for the dev workflow see
[CONTRIBUTING.md](CONTRIBUTING.md).

- **Platform:** Next.js 15 (App Router), TypeScript, deployed as a standalone
  Docker image on a self-managed VM behind a shared Caddy reverse proxy.
- **Size:** ~1.5k lines of TypeScript across `src/`, one Postgres database,
  two containers (app + db) plus a one-shot migration service.
- **Philosophy:** the Google Sheet is the *write* interface, the site is the
  *read* interface. The app never writes to the sheet; the database is a
  disposable mirror that can be rebuilt from the sheet at any moment. Pure
  business logic (parsing, filters, money) is developed test-first (Vitest);
  thin wrappers around Prisma/Google APIs are not unit-tested.

---

## 1. High-level flow

```
Google Sheet «Бюджет»                  Входной интерфейс: ручной ввод +
  Операции / Категории / Курсы         Telegram-бот (пишет в таблицу)
        │
        │  Sheets API v4, batchGet, read-only service account
        ▼
  lib/sheets.ts ──► lib/parse.ts ──► lib/sync.ts   full reload in one tx
        ▲                                 │
        │  every 10 min (instrumentation  ▼
        │  → HTTP loopback POST)      Postgres (Operation / Category / Rate /
        │                             SyncState / User)
  /api/sync  (Bearer token)               │
                                          ▼
                        lib/analytics.ts (KPI, groupBy, series, pagination)
                                          │
                                          ▼
Browser ──► requireUser() ──► app/page.tsx (RSC) ──► components/* (Recharts)
            NextAuth v5           filters from URL      Сум/USD conversion
            credentials           (lib/filters.ts)      (lib/money.ts)
```

## 2. Tech stack

| Layer      | Choice                                       | Notes                                             |
| ---------- | -------------------------------------------- | ------------------------------------------------- |
| Framework  | Next.js 15, App Router, `output: standalone` | RSC dashboard, server actions for login/logout    |
| Language   | TypeScript                                   | strict; plain JS only in `scripts/seed-user.mjs`  |
| ORM / DB   | Prisma 6 / PostgreSQL 16                     | migrations applied by a one-shot compose service  |
| Auth       | NextAuth v5 (beta), Credentials + bcryptjs   | JWT session, single seeded user                   |
| Sheets     | googleapis (Sheets API v4)                   | read-only scope, `serverExternalPackages`         |
| UI         | Tailwind v4, Recharts                        | fixed dark theme, mobile-first                    |
| Tests      | Vitest                                       | colocated `*.test.ts` on pure functions           |
| Infra      | Docker Compose, shared Caddy, Infisical      | auto-deploy via GitHub webhook on push to `main`  |

## 3. Source layout

```
src/
  app/
    page.tsx                dashboard (RSC): reads filters from URL, Promise.all over aggregations
    login/page.tsx          login form (server action → NextAuth signIn)
    api/sync/route.ts       POST run sync / GET last status — Bearer SYNC_TOKEN
    api/dashboard/route.ts  JSON aggregations for the current filters (session-gated)
    api/auth/[...nextauth]/ NextAuth handlers
  auth.ts / auth.config.ts  NextAuth v5 split config (node-only part vs. shared)
  instrumentation.ts        in-process scheduler: POSTs /api/sync every SYNC_INTERVAL_MIN
  lib/
    sheets.ts               batchGet of the three sheets via service account
    parse.ts                pure parsers: dd.mm.yyyy dates, comma decimals, dedupe   [TDD-able]
    sync.ts                 full-reload transaction + SyncState bookkeeping
    analytics.ts            getKpi / getByCategory / getDailySeries / getOperations / getDashboard
    filters.ts              URL params → typed Filters (defaults, clamping)          [tested]
    money.ts                Сум↔USD conversion + ru formatting                        [tested]
    params.ts               client-side query-string builder
    guard.ts                requireUser() — RSC auth gate
    ui.ts                   palette, date formatting (client-safe)
    prisma.ts               PrismaClient singleton
  components/               KpiCards, DailyChart, CategoryChart, FilterBar,
                            OperationsTable, Pagination, CurrencyToggle
prisma/                     schema + 0_init migration
scripts/seed-user.mjs       idempotent admin seed from ADMIN_EMAIL/ADMIN_PASSWORD
Dockerfile                  multi-stage: deps → builder → standalone runner
docker-compose.prod.yml     db + one-shot migrate (builder stage) + app
docker-entrypoint.sh        seed user → node server.js
```

## 4. Data model

The database mirrors the sheet; every sync is a full reload, so no table below
is a source of truth except `User`.

- **Operation** — one row of «Операции»: `date`, `category`, `description`,
  `amountSum` (Decimal 18,2 — the base amount in Uzbek sum), `currency`,
  `type` («Доход»/«Расход»), `sourceRow` (row number in the sheet, for
  debugging). Indexed by `date`, `category`, `type`.
- **Category** — the «Категории» reference list: `name` (unique), `type`.
- **Rate** — USD→sum rate history from «Курсы» E:F: `date` (unique), `rate`
  (Decimal 18,4). The latest row by date is the conversion rate for the UI.
- **User** — the single dashboard login (email + bcrypt hash), upserted by the
  seed script on every container start.
- **SyncState** — a single row (`id = 1`): time, row counts per entity,
  ok/error flag, message. Shown on the dashboard and via `GET /api/sync`.

Amounts are stored **in sum only**; USD is always derived at render time from
the latest rate — so a rate update retroactively re-prices history, matching
how the sheet itself behaves.

## 5. Sync pipeline

1. `fetchSheets()` — one `spreadsheets.values.batchGet` for
   `Операции!A2:G`, `Категории!A1:B`, `Курсы!E2:F` with
   `UNFORMATTED_VALUE` + `FORMATTED_STRING` dates.
2. `parse.ts` — pure functions turn raw rows into typed records: `dd.mm.yyyy`
   → UTC dates (with overflow rejection), comma decimals, category dedupe by
   name, rate dedupe by date. Rows with missing date/amount/type are skipped.
3. `runSync()` — a single Prisma transaction: `deleteMany` + `createMany` for
   operations and categories, upsert per rate, then upsert `SyncState`.
   Failures are recorded into `SyncState` (`recordSyncFailure`) without
   touching the data — the dashboard keeps serving the last good snapshot.
4. Scheduling — `instrumentation.ts` POSTs `http://127.0.0.1:$PORT/api/sync`
   with the Bearer token on boot and every `SYNC_INTERVAL_MIN` minutes, with
   an overlap guard.

## 6. Key decisions

- **Full reload over incremental sync.** The dataset is a personal budget
  (hundreds of rows); a transactional wipe-and-load is simpler, self-healing
  (edits and deletions in the sheet propagate automatically), and fast enough
  (~1.5 s including the Sheets fetch).
- **Sheet is never written.** All writes go through the sheet's own interface
  (manual entry, the Telegram bot). The app needs only the read-only scope, so
  a leaked key cannot corrupt the source data.
- **Scheduler calls its own HTTP API instead of importing the sync module.**
  Importing `googleapis` from `instrumentation.ts` drags a large Node-only
  dependency tree into Next's instrumentation bundle and breaks dev/edge
  builds. A loopback `fetch` with the same Bearer token keeps one code path
  for cron, button, and external callers.
- **No edge middleware; auth is `requireUser()` in RSC.** The NextAuth v5
  middleware pattern forces an edge-compiled bundle that conflicts with
  Node-only deps. A server-side `auth()` check in the two pages plus
  session-gated API routes covers the same surface with less machinery.
- **Migrations run as a one-shot compose service from the *builder* stage.**
  The prisma CLI does not work inside the pruned standalone runner image (its
  transitive deps are gone). A `migrate` service reuses the builder image,
  runs `prisma migrate deploy`, and the app starts only after it exits
  successfully.
- **Standalone runner gotchas** (encoded in the Dockerfile): `HOSTNAME=0.0.0.0`
  so the server listens beyond localhost; `bcryptjs` copied in explicitly for
  the seed script (Next bundles it for the app, but the seed runs outside the
  bundle); an empty `public/` kept via `.gitkeep` for the `COPY`.
- **Service-account key via `GOOGLE_SA_JSON_B64`.** The key arrives as a
  base64 env var rendered from the secrets store at deploy time; no key file
  is baked into the image or mounted from disk. A `GOOGLE_SA_JSON_FILE`
  fallback exists for local dev.
- **All dashboard state in the URL.** Filters, page, and currency are query
  params parsed by `normalizeFilters()`; the RSC re-renders per request. No
  client state store, and every view is shareable/bookmarkable.
- **Fixed dark theme.** The dashboard commits to one look; `color-scheme:
  dark` keeps native controls (date pickers, selects) consistent with it.
