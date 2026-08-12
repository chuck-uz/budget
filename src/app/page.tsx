import { signOut } from "@/auth";
import { requireUser } from "@/lib/guard";
import {
  getCategories,
  getDashboard,
  getDateBounds,
} from "@/lib/analytics";
import { normalizeFilters, type RawParams } from "@/lib/filters";
import { CurrencyToggle } from "@/components/CurrencyToggle";
import { FilterBar } from "@/components/FilterBar";
import { KpiCards } from "@/components/KpiCards";
import { CategoryChart } from "@/components/CategoryChart";
import { DailyChart } from "@/components/DailyChart";
import { OperationsTable } from "@/components/OperationsTable";

export const dynamic = "force-dynamic";

async function logout() {
  "use server";
  await signOut({ redirectTo: "/login" });
}

const ymd = (d: Date) => d.toISOString().slice(0, 10);

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<RawParams>;
}) {
  const session = await requireUser();
  const params = await searchParams;
  const filters = normalizeFilters(params, new Date());

  const [dash, categories, bounds] = await Promise.all([
    getDashboard(filters),
    getCategories(),
    getDateBounds(),
  ]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-5xl flex-col gap-4 px-4 py-6 sm:px-6 sm:py-8">
      {/* Шапка */}
      <header className="flex items-center justify-between gap-4">
        <div className="flex flex-col">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Бюджет
          </h1>
          <span className="text-xs text-white/50">{session.user?.email}</span>
        </div>
        <div className="flex items-center gap-2">
          <CurrencyToggle value={filters.currency} />
          <form action={logout}>
            <button
              type="submit"
              className="h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white/70 transition-colors hover:text-white"
            >
              Выйти
            </button>
          </form>
        </div>
      </header>

      <FilterBar
        from={ymd(filters.from)}
        to={ymd(filters.to)}
        category={filters.category}
        type={filters.type}
        q={filters.q}
        categories={categories.map((c) => c.name)}
        bounds={bounds}
      />

      <KpiCards kpi={dash.kpi} currency={filters.currency} rate={dash.rate} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DailyChart data={dash.series} currency={filters.currency} rate={dash.rate} />
        <CategoryChart
          data={dash.byExpense}
          currency={filters.currency}
          rate={dash.rate}
        />
      </div>

      <OperationsTable
        page={dash.operations}
        currency={filters.currency}
        rate={dash.rate}
      />

      <footer className="pt-2 text-center text-xs text-white/30">
        Курс: {dash.rate ? `1$ = ${dash.rate.toLocaleString("ru-RU")} сум` : "—"} ·
        данные из Google-таблицы
      </footer>
    </main>
  );
}
