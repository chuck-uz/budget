// Деньги и конвертация. База хранения — сумы (amountSum). USD считается по курсу.
export type Currency = "SUM" | "USD";

/** Перевод базовой суммы (в сумах) в выбранную валюту по курсу (сум за 1 USD). */
export function toCurrency(
  amountSum: number,
  currency: Currency,
  rate: number | null,
): number {
  if (currency === "USD") {
    if (!rate || rate <= 0) return 0;
    return amountSum / rate;
  }
  return amountSum;
}

// ru-RU разделяет разряды неразрывными пробелами — приводим к обычному пробелу.
function nbsp(s: string): string {
  return s.replace(/ | /g, " ");
}

/** Форматирование для UI (ru): сум — без копеек и с пробелами; USD — 2 знака и «$». */
export function formatMoney(value: number, currency: Currency): string {
  if (currency === "USD") {
    const s = nbsp(
      new Intl.NumberFormat("ru-RU", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value),
    );
    return `$${s}`;
  }
  const s = nbsp(
    new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(
      Math.round(value),
    ),
  );
  return `${s} сум`;
}

/** Готовое к показу значение: конвертация + формат. */
export function displayMoney(
  amountSum: number,
  currency: Currency,
  rate: number | null,
): string {
  return formatMoney(toCurrency(amountSum, currency, rate), currency);
}
