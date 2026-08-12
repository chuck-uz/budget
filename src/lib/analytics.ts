import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import type { Filters } from "./filters";

// Агрегации дашборда поверх синхронизированных данных. Суммы — база в сумах (number).

export type Kpi = { income: number; expense: number; balance: number };
export type CategorySlice = { category: string; total: number; share: number };
export type DayPoint = { date: string; income: number; expense: number };
export type OperationRow = {
  id: number;
  date: string; // YYYY-MM-DD
  category: string;
  description: string;
  amountSum: number;
  type: string;
};
export type OperationsPage = {
  rows: OperationRow[];
  total: number;
  page: number;
  pageSize: number;
};

const n = (v: Prisma.Decimal | null | undefined): number =>
  v == null ? 0 : Number(v);

const ymd = (d: Date): string => d.toISOString().slice(0, 10);

/** WHERE по фильтрам. `withType` — применять ли фильтр по типу (для KPI не применяем). */
function buildWhere(f: Filters, withType: boolean): Prisma.OperationWhereInput {
  const where: Prisma.OperationWhereInput = {
    date: { gte: f.from, lte: f.to },
  };
  if (f.category) where.category = f.category;
  if (f.q) {
    where.OR = [
      { description: { contains: f.q, mode: "insensitive" } },
      { category: { contains: f.q, mode: "insensitive" } },
    ];
  }
  if (withType && f.type !== "all") where.type = f.type;
  return where;
}

/** Актуальный (самый свежий по дате) курс сум за 1 USD. */
export async function getLatestRate(): Promise<number | null> {
  const r = await prisma.rate.findFirst({ orderBy: { date: "desc" } });
  return r ? Number(r.rate) : null;
}

/** Доход / расход / остаток за период (фильтр по типу не применяется). */
export async function getKpi(f: Filters): Promise<Kpi> {
  const where = buildWhere(f, false);
  const [inc, exp] = await Promise.all([
    prisma.operation.aggregate({
      _sum: { amountSum: true },
      where: { ...where, type: "Доход" },
    }),
    prisma.operation.aggregate({
      _sum: { amountSum: true },
      where: { ...where, type: "Расход" },
    }),
  ]);
  const income = n(inc._sum.amountSum);
  const expense = n(exp._sum.amountSum);
  return { income, expense, balance: income - expense };
}

/** Разбивка по категориям заданного типа (по умолчанию расходы), доля в процентах. */
export async function getByCategory(
  f: Filters,
  type: "Доход" | "Расход" = "Расход",
): Promise<CategorySlice[]> {
  const where = { ...buildWhere(f, false), type };
  const grouped = await prisma.operation.groupBy({
    by: ["category"],
    where,
    _sum: { amountSum: true },
    orderBy: { _sum: { amountSum: "desc" } },
  });
  const total = grouped.reduce((s, g) => s + n(g._sum.amountSum), 0);
  return grouped.map((g) => {
    const t = n(g._sum.amountSum);
    return {
      category: g.category,
      total: t,
      share: total > 0 ? (t / total) * 100 : 0,
    };
  });
}

/** Дневной ряд доход/расход за период (для графиков и истории). */
export async function getDailySeries(f: Filters): Promise<DayPoint[]> {
  const grouped = await prisma.operation.groupBy({
    by: ["date", "type"],
    where: buildWhere(f, false),
    _sum: { amountSum: true },
  });
  const map = new Map<string, DayPoint>();
  for (const g of grouped) {
    const key = ymd(g.date);
    const point = map.get(key) ?? { date: key, income: 0, expense: 0 };
    if (g.type === "Доход") point.income += n(g._sum.amountSum);
    else if (g.type === "Расход") point.expense += n(g._sum.amountSum);
    map.set(key, point);
  }
  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
}

/** Список операций с фильтрами и пагинацией (тип применяется). */
export async function getOperations(f: Filters): Promise<OperationsPage> {
  const where = buildWhere(f, true);
  const [total, rows] = await Promise.all([
    prisma.operation.count({ where }),
    prisma.operation.findMany({
      where,
      orderBy: [{ date: "desc" }, { id: "desc" }],
      skip: (f.page - 1) * f.pageSize,
      take: f.pageSize,
    }),
  ]);
  return {
    total,
    page: f.page,
    pageSize: f.pageSize,
    rows: rows.map((o) => ({
      id: o.id,
      date: ymd(o.date),
      category: o.category,
      description: o.description,
      amountSum: n(o.amountSum),
      type: o.type,
    })),
  };
}

/** Все категории (для выпадающего фильтра). */
export async function getCategories(): Promise<
  { name: string; type: string }[]
> {
  return prisma.category.findMany({ orderBy: { name: "asc" } });
}

/** Диапазон дат всех операций (для дефолтов «за всё время»). */
export async function getDateBounds(): Promise<{
  min: string | null;
  max: string | null;
}> {
  const [min, max] = await Promise.all([
    prisma.operation.findFirst({ orderBy: { date: "asc" }, select: { date: true } }),
    prisma.operation.findFirst({ orderBy: { date: "desc" }, select: { date: true } }),
  ]);
  return {
    min: min ? ymd(min.date) : null,
    max: max ? ymd(max.date) : null,
  };
}

/** Полный набор данных дашборда под один набор фильтров. */
export async function getDashboard(f: Filters) {
  const [kpi, byExpense, byIncome, series, operations, rate] =
    await Promise.all([
      getKpi(f),
      getByCategory(f, "Расход"),
      getByCategory(f, "Доход"),
      getDailySeries(f),
      getOperations(f),
      getLatestRate(),
    ]);
  return { kpi, byExpense, byIncome, series, operations, rate };
}
