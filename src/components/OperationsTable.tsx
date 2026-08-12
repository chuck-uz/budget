import type { OperationsPage } from "@/lib/analytics";
import { displayMoney, type Currency } from "@/lib/money";
import { COLOR_EXPENSE, COLOR_INCOME, fullDate } from "@/lib/ui";
import { Pagination } from "./Pagination";

export function OperationsTable({
  page,
  currency,
  rate,
}: {
  page: OperationsPage;
  currency: Currency;
  rate: number | null;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-white/70">Операции</h2>
        <span className="text-xs text-white/40">всего: {page.total}</span>
      </div>

      {page.rows.length === 0 ? (
        <div className="py-8 text-center text-sm text-white/40">
          Нет операций по фильтрам
        </div>
      ) : (
        <ul className="divide-y divide-white/5">
          {page.rows.map((r) => {
            const income = r.type === "Доход";
            const color = income ? COLOR_INCOME : COLOR_EXPENSE;
            const sign = income ? "+" : "−";
            return (
              <li key={r.id} className="flex items-center gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-white/90">
                    {r.category}
                    {r.description ? (
                      <span className="text-white/40"> · {r.description}</span>
                    ) : null}
                  </div>
                  <div className="text-xs text-white/40">{fullDate(r.date)}</div>
                </div>
                <div
                  className="shrink-0 whitespace-nowrap text-sm font-medium tabular-nums"
                  style={{ color }}
                >
                  {sign}
                  {displayMoney(r.amountSum, currency, rate)}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Pagination
        page={page.page}
        pageSize={page.pageSize}
        total={page.total}
      />
    </section>
  );
}
