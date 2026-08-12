import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { fetchSheets } from "./sheets";
import {
  latestRateOf,
  parseCategories,
  parseOperations,
  parseRates,
} from "./parse";

export type SyncResult = {
  ok: boolean;
  ops: number;
  categories: number;
  rates: number;
  message: string;
};

function dec(n: number, places: number): Prisma.Decimal {
  return new Prisma.Decimal(n.toFixed(places));
}

/**
 * Полная перезагрузка: читает 3 листа таблицы и переписывает Postgres в одной транзакции.
 * Данных немного — проще и надёжнее, чем инкрементальная синхронизация.
 */
export async function runSync(): Promise<SyncResult> {
  const raw = await fetchSheets();

  const rates = parseRates(raw.rates);
  const latestRate = latestRateOf(rates);
  const categories = parseCategories(raw.categories);
  const operations = parseOperations(raw.operations, latestRate);

  await prisma.$transaction(
    async (tx) => {
      await tx.operation.deleteMany({});
      await tx.category.deleteMany({});

      if (categories.length) {
        await tx.category.createMany({ data: categories });
      }
      if (operations.length) {
        await tx.operation.createMany({
          data: operations.map((o) => ({
            date: o.date,
            category: o.category,
            description: o.description,
            amountSum: dec(o.amountSum, 2),
            currency: o.currency,
            type: o.type,
            sourceRow: o.sourceRow,
          })),
        });
      }
      for (const r of rates) {
        await tx.rate.upsert({
          where: { date: r.date },
          create: { date: r.date, rate: dec(r.rate, 4) },
          update: { rate: dec(r.rate, 4) },
        });
      }

      await tx.syncState.upsert({
        where: { id: 1 },
        create: {
          id: 1,
          syncedAt: new Date(),
          ops: operations.length,
          categories: categories.length,
          rates: rates.length,
          ok: true,
          message: "",
        },
        update: {
          syncedAt: new Date(),
          ops: operations.length,
          categories: categories.length,
          rates: rates.length,
          ok: true,
          message: "",
        },
      });
    },
    { timeout: 30_000 },
  );

  return {
    ok: true,
    ops: operations.length,
    categories: categories.length,
    rates: rates.length,
    message: "",
  };
}

/** Записать в SyncState факт ошибки (вызывается из обработчиков /api/sync и планировщика). */
export async function recordSyncFailure(message: string): Promise<void> {
  try {
    await prisma.syncState.upsert({
      where: { id: 1 },
      create: { id: 1, syncedAt: new Date(), ok: false, message },
      update: { syncedAt: new Date(), ok: false, message },
    });
  } catch {
    // БД недоступна — молча, ошибку и так вернём наверх
  }
}
