// Чистые парсеры значений из таблицы — без побочных эффектов, легко тестировать.

/** "10.08.2026" → Date (UTC-полночь). Возвращает null, если формат не dd.mm.yyyy. */
export function parseRuDate(value: unknown): Date | null {
  const m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(String(value ?? "").trim());
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const d = new Date(Date.UTC(year, month - 1, day));
  // отсечь переполнение (напр. 31.02) — JS нормализует, мы это ловим
  if (d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) return null;
  return d;
}

/** Число из ячейки: уже число — как есть; строка — с учётом пробелов и запятой-десятичной. */
export function parseNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const s = value.replace(/\s/g, "").replace(",", ".");
    if (s === "") return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export type ParsedOperation = {
  date: Date;
  category: string;
  description: string;
  amountSum: number; // база в сумах
  currency: string;
  type: string;
  sourceRow: number;
};

export type ParsedCategory = { name: string; type: string };
export type ParsedRate = { date: Date; rate: number };

/**
 * Разбор строк листа «Операции» (диапазон A2:G). База (amountSum) — колонка D в сумах;
 * если валюта помечена USD, приводим к сумам по latestRate (страховка — обычно всё в SUM).
 */
export function parseOperations(
  rows: (readonly unknown[])[],
  latestRate: number | null,
): ParsedOperation[] {
  const out: ParsedOperation[] = [];
  let rowNum = 1; // строка 1 — заголовок; данные с 2-й
  for (const row of rows) {
    rowNum++;
    const date = parseRuDate(row[0]);
    const category = String(row[1] ?? "").trim();
    const description = String(row[2] ?? "").trim();
    const amount = parseNumber(row[3]);
    const currency = (String(row[4] ?? "").trim() || "SUM").toUpperCase();
    const type = String(row[5] ?? "").trim();
    if (!date || amount == null || !type) continue;
    let amountSum = amount;
    if (currency === "USD" && latestRate) amountSum = amount * latestRate;
    out.push({
      date,
      category,
      description,
      amountSum,
      currency,
      type,
      sourceRow: rowNum,
    });
  }
  return out;
}

/** Разбор листа «Категории» (A1:B). Дедуп по имени, тип по умолчанию «Расход». */
export function parseCategories(rows: (readonly unknown[])[]): ParsedCategory[] {
  const map = new Map<string, ParsedCategory>();
  for (const row of rows) {
    const name = String(row[0] ?? "").trim();
    if (!name) continue;
    const type = String(row[1] ?? "").trim() || "Расход";
    map.set(name, { name, type });
  }
  return [...map.values()];
}

/** Разбор истории курса (E2:F). Дедуп по дате (последняя запись за дату побеждает). */
export function parseRates(rows: (readonly unknown[])[]): ParsedRate[] {
  const map = new Map<number, ParsedRate>();
  for (const row of rows) {
    const date = parseRuDate(row[0]);
    const rate = parseNumber(row[1]);
    if (!date || rate == null || rate <= 0) continue;
    map.set(date.getTime(), { date, rate });
  }
  return [...map.values()];
}

/** Самый свежий курс из уже разобранного списка. */
export function latestRateOf(rates: ParsedRate[]): number | null {
  let best: ParsedRate | null = null;
  for (const r of rates) if (!best || r.date > best.date) best = r;
  return best?.rate ?? null;
}
