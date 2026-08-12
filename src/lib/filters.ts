import type { Currency } from "./money";

// Нормализация фильтров дашборда из query-параметров (URL) в типизированный объект.

export type OpType = "all" | "Доход" | "Расход";

export type Filters = {
  from: Date; // включительно (UTC-полночь)
  to: Date; // включительно (UTC-полночь)
  category: string | null; // null — все категории
  type: OpType;
  q: string; // поиск по описанию/категории
  currency: Currency;
  page: number; // с 1
  pageSize: number;
};

export type RawParams = Record<string, string | string[] | undefined>;

function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

/** "2026-08-01" → Date(UTC). null, если не ISO-дата. */
export function parseIsoDate(value: string | undefined): Date | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  if (d.getUTCFullYear() !== +m[1] || d.getUTCMonth() !== +m[2] - 1) return null;
  return d;
}

export function startOfMonthUTC(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export function endOfMonthUTC(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
}

const PAGE_SIZES = [25, 50, 100, 200];

/**
 * Разбор параметров в фильтры. `now` передаётся явно (тестируемость).
 * По умолчанию — текущий месяц, валюта SUM, тип «все», страница 1.
 */
export function normalizeFilters(params: RawParams, now: Date): Filters {
  const from = parseIsoDate(one(params.from)) ?? startOfMonthUTC(now);
  let to = parseIsoDate(one(params.to)) ?? endOfMonthUTC(now);
  if (to < from) to = from; // защита от инвертированного диапазона

  const typeRaw = one(params.type);
  const type: OpType =
    typeRaw === "Доход" || typeRaw === "Расход" ? typeRaw : "all";

  const currency: Currency = one(params.currency) === "USD" ? "USD" : "SUM";

  const category = (one(params.category) ?? "").trim() || null;
  const q = (one(params.q) ?? "").trim();

  const page = Math.max(1, Number.parseInt(one(params.page) ?? "1", 10) || 1);
  const sizeRaw = Number.parseInt(one(params.pageSize) ?? "50", 10);
  const pageSize = PAGE_SIZES.includes(sizeRaw) ? sizeRaw : 50;

  return { from, to, category, type, q, currency, page, pageSize };
}
