"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DayPoint } from "@/lib/analytics";
import { formatMoney, toCurrency, type Currency } from "@/lib/money";
import { COLOR_EXPENSE, COLOR_INCOME, shortDate } from "@/lib/ui";

type Row = { date: string; Доход: number; Расход: number };

export function DailyChart({
  data,
  currency,
  rate,
}: {
  data: DayPoint[];
  currency: Currency;
  rate: number | null;
}) {
  const rows: Row[] = data.map((d) => ({
    date: d.date,
    Доход: toCurrency(d.income, currency, rate),
    Расход: toCurrency(d.expense, currency, rate),
  }));

  if (data.length === 0) {
    return (
      <div className="flex h-full min-h-56 items-center justify-center rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/40">
        Нет данных за период
      </div>
    );
  }

  const tick = { fill: "rgba(255,255,255,0.4)", fontSize: 11 };

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-white/70">Динамика по дням</h2>
        <div className="flex gap-3 text-xs text-white/50">
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: COLOR_INCOME }}
            />
            Доход
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: COLOR_EXPENSE }}
            />
            Расход
          </span>
        </div>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={rows} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
            <defs>
              <linearGradient id="gInc" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLOR_INCOME} stopOpacity={0.35} />
                <stop offset="100%" stopColor={COLOR_INCOME} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLOR_EXPENSE} stopOpacity={0.35} />
                <stop offset="100%" stopColor={COLOR_EXPENSE} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={shortDate}
              tick={tick}
              axisLine={false}
              tickLine={false}
              minTickGap={16}
            />
            <YAxis
              tick={tick}
              axisLine={false}
              tickLine={false}
              width={44}
              tickFormatter={(v: number) =>
                new Intl.NumberFormat("ru-RU", { notation: "compact" }).format(v)
              }
            />
            <Tooltip
              contentStyle={{
                background: "#0b0f17",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelFormatter={(l) => shortDate(String(l))}
              formatter={(value, name) =>
                [formatMoney(Number(value), currency), name] as [string, typeof name]
              }
            />
            <Area
              type="monotone"
              dataKey="Доход"
              stroke={COLOR_INCOME}
              fill="url(#gInc)"
              strokeWidth={2}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="Расход"
              stroke={COLOR_EXPENSE}
              fill="url(#gExp)"
              strokeWidth={2}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
