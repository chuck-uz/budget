// Мелкие UI-хелперы (без серверных зависимостей — можно импортировать в клиентские компоненты).

/** "2026-08-10" → "10.08". */
export function shortDate(ymd: string): string {
  const [, m, d] = ymd.split("-");
  return `${d}.${m}`;
}

/** "2026-08-10" → "10.08.2026". */
export function fullDate(ymd: string): string {
  const [y, m, d] = ymd.split("-");
  return `${d}.${m}.${y}`;
}

// Палитра для категорий (десатурированная, читаемая на тёмном фоне).
export const CATEGORY_COLORS = [
  "#60a5fa",
  "#f472b6",
  "#34d399",
  "#fbbf24",
  "#a78bfa",
  "#22d3ee",
  "#fb923c",
  "#4ade80",
  "#e879f9",
  "#94a3b8",
];

export const COLOR_INCOME = "#34d399"; // доход
export const COLOR_EXPENSE = "#f87171"; // расход
export const COLOR_BALANCE = "#60a5fa"; // остаток

export function categoryColor(index: number): string {
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length];
}
