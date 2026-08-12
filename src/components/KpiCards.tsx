import { displayMoney, type Currency } from "@/lib/money";
import type { Kpi } from "@/lib/analytics";
import { COLOR_BALANCE, COLOR_EXPENSE, COLOR_INCOME } from "@/lib/ui";

function Card({
  label,
  amount,
  currency,
  rate,
  color,
}: {
  label: string;
  amount: number;
  currency: Currency;
  rate: number | null;
  color: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-2 text-sm text-white/60">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: color }}
        />
        {label}
      </div>
      <div className="text-2xl font-semibold tabular-nums tracking-tight">
        {displayMoney(amount, currency, rate)}
      </div>
    </div>
  );
}

export function KpiCards({
  kpi,
  currency,
  rate,
}: {
  kpi: Kpi;
  currency: Currency;
  rate: number | null;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <Card
        label="Доход"
        amount={kpi.income}
        currency={currency}
        rate={rate}
        color={COLOR_INCOME}
      />
      <Card
        label="Расход"
        amount={kpi.expense}
        currency={currency}
        rate={rate}
        color={COLOR_EXPENSE}
      />
      <Card
        label="Остаток"
        amount={kpi.balance}
        currency={currency}
        rate={rate}
        color={COLOR_BALANCE}
      />
    </div>
  );
}
