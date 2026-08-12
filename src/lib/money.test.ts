import { describe, expect, it } from "vitest";
import { displayMoney, formatMoney, toCurrency } from "./money";

describe("toCurrency", () => {
  it("возвращает сумму как есть для SUM", () => {
    expect(toCurrency(13_841_217, "SUM", 11934.61)).toBe(13_841_217);
  });
  it("делит на курс для USD", () => {
    expect(toCurrency(13_841_217, "USD", 11934.61)).toBeCloseTo(1159.75, 2);
  });
  it("возвращает 0 в USD при отсутствии/невалидном курсе", () => {
    expect(toCurrency(1000, "USD", null)).toBe(0);
    expect(toCurrency(1000, "USD", 0)).toBe(0);
  });
});

describe("formatMoney", () => {
  it("сум — без копеек, с разделением разрядов", () => {
    expect(formatMoney(13_841_217, "SUM")).toBe("13 841 217 сум");
  });
  it("USD — 2 знака и знак доллара", () => {
    expect(formatMoney(1159.75, "USD")).toBe("$1 159,75");
  });
  it("сум округляет дробное", () => {
    expect(formatMoney(75000.4, "SUM")).toBe("75 000 сум");
  });
});

describe("displayMoney", () => {
  it("конвертирует и форматирует USD", () => {
    expect(displayMoney(13_841_217, "USD", 11934.61)).toBe("$1 159,75");
  });
});
