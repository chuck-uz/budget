import { describe, expect, it } from "vitest";
import {
  endOfMonthUTC,
  normalizeFilters,
  parseIsoDate,
  startOfMonthUTC,
} from "./filters";

const NOW = new Date(Date.UTC(2026, 7, 12)); // 2026-08-12

describe("parseIsoDate", () => {
  it("парсит ISO-дату в UTC", () => {
    expect(parseIsoDate("2026-08-01")?.toISOString()).toBe(
      "2026-08-01T00:00:00.000Z",
    );
  });
  it("отклоняет мусор и переполнение", () => {
    expect(parseIsoDate("2026-13-01")).toBeNull();
    expect(parseIsoDate("нет")).toBeNull();
    expect(parseIsoDate(undefined)).toBeNull();
  });
});

describe("границы месяца", () => {
  it("начало и конец августа 2026", () => {
    expect(startOfMonthUTC(NOW).toISOString()).toBe("2026-08-01T00:00:00.000Z");
    expect(endOfMonthUTC(NOW).toISOString()).toBe("2026-08-31T00:00:00.000Z");
  });
});

describe("normalizeFilters", () => {
  it("дефолты — текущий месяц, SUM, тип all, стр.1", () => {
    const f = normalizeFilters({}, NOW);
    expect(f.from.toISOString()).toBe("2026-08-01T00:00:00.000Z");
    expect(f.to.toISOString()).toBe("2026-08-31T00:00:00.000Z");
    expect(f.currency).toBe("SUM");
    expect(f.type).toBe("all");
    expect(f.category).toBeNull();
    expect(f.q).toBe("");
    expect(f.page).toBe(1);
    expect(f.pageSize).toBe(50);
  });

  it("читает явные значения", () => {
    const f = normalizeFilters(
      {
        from: "2026-01-01",
        to: "2026-12-31",
        type: "Расход",
        currency: "USD",
        category: "Такси",
        q: "  обед ",
        page: "3",
        pageSize: "100",
      },
      NOW,
    );
    expect(f.from.toISOString()).toBe("2026-01-01T00:00:00.000Z");
    expect(f.to.toISOString()).toBe("2026-12-31T00:00:00.000Z");
    expect(f.type).toBe("Расход");
    expect(f.currency).toBe("USD");
    expect(f.category).toBe("Такси");
    expect(f.q).toBe("обед");
    expect(f.page).toBe(3);
    expect(f.pageSize).toBe(100);
  });

  it("инвертированный диапазон схлопывается (to>=from)", () => {
    const f = normalizeFilters({ from: "2026-08-10", to: "2026-08-01" }, NOW);
    expect(f.to.getTime()).toBe(f.from.getTime());
  });

  it("невалидные type/currency/pageSize → дефолты", () => {
    const f = normalizeFilters(
      { type: "хз", currency: "EUR", pageSize: "7", page: "0" },
      NOW,
    );
    expect(f.type).toBe("all");
    expect(f.currency).toBe("SUM");
    expect(f.pageSize).toBe(50);
    expect(f.page).toBe(1);
  });
});
