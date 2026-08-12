"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import type { CategorySlice } from "@/lib/analytics";
import { displayMoney, type Currency } from "@/lib/money";
import { categoryColor } from "@/lib/ui";

const TOP = 8;

export function CategoryChart({
  data,
  currency,
  rate,
}: {
  data: CategorySlice[];
  currency: Currency;
  rate: number | null;
}) {
  // Топ-N + «Остальные».
  const top = data.slice(0, TOP);
  const restTotal = data.slice(TOP).reduce((s, c) => s + c.total, 0);
  const restShare = data.slice(TOP).reduce((s, c) => s + c.share, 0);
  const slices = restTotal
    ? [...top, { category: "Остальные", total: restTotal, share: restShare }]
    : top;

  if (data.length === 0) {
    return (
      <div className="flex h-full min-h-56 items-center justify-center rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/40">
        Нет расходов за период
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/5 p-4">
      <h2 className="text-sm font-medium text-white/70">Расходы по категориям</h2>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
        <div className="h-44 w-44 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={slices}
                dataKey="total"
                nameKey="category"
                innerRadius={52}
                outerRadius={80}
                paddingAngle={2}
                stroke="none"
                isAnimationActive={false}
              >
                {slices.map((s, i) => (
                  <Cell key={s.category} fill={categoryColor(i)} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <ul className="flex w-full flex-col gap-1.5">
          {slices.map((s, i) => (
            <li key={s.category} className="flex items-center gap-2 text-sm">
              <span
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: categoryColor(i) }}
              />
              <span className="truncate text-white/80">{s.category}</span>
              <span className="ml-auto shrink-0 tabular-nums text-white/50">
                {s.share.toFixed(0)}%
              </span>
              <span className="w-28 shrink-0 text-right tabular-nums text-white/70">
                {displayMoney(s.total, currency, rate)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
