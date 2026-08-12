// Построение query-строки при изменении фильтров (чистая функция, для клиента).
export function buildQuery(
  current: URLSearchParams,
  updates: Record<string, string | null>,
  opts: { resetPage?: boolean } = {},
): string {
  const next = new URLSearchParams(current.toString());
  for (const [key, value] of Object.entries(updates)) {
    if (value === null || value === "") next.delete(key);
    else next.set(key, value);
  }
  if (opts.resetPage) next.delete("page");
  const s = next.toString();
  return s ? `/?${s}` : "/";
}
