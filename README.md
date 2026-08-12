# budget — дашборд личного бюджета

Аналитический дашборд поверх Google-таблицы «Бюджет». Таблица остаётся источником
ввода (ты + Telegram-бот OpenClaw); сюда данные **синхронизируются** в Postgres для
быстрой аналитики, фильтров и истории.

## Стек
Next.js (App Router) · Prisma · PostgreSQL · Tailwind · Recharts · NextAuth.

## Архитектура
```
Google Sheet «Бюджет»  ──sync (cron + кнопка)──▶  Postgres  ──▶  Next.js дашборд
        ▲ ввод: ты + бот                                          (budget.oresh.in, за логином)
```

## Данные (зеркало таблицы)
- `Operation` — операции (дата, категория, описание, сумма в сумах, тип).
- `Category` — справочник категорий (+ тип Доход/Расход).
- `Rate` — история курса USD→сум.
- `User` — вход. `SyncState` — метаданные синхрона.

## v1 (ядро)
KPI (доход/расход/остаток) · разбивка по категориям с дрилл-дауном · фильтры
(период/категория/тип/поиск) · таблица операций · переключатель Сум/USD.
Дальше: тренды/история, AI-анализ, лимиты/прогноз.

## Локально
```bash
cp .env.example .env   # заполнить DATABASE_URL
npm install
npm run build
```

## Деплой
Push в `main` → webhook на VM → `docker compose -f docker-compose.prod.yml up -d --build`.
Секреты (ключ сервис-аккаунта, DB-пароль, NEXTAUTH_SECRET) — из Infisical, рендерятся в `.env`/`sa.json`.
