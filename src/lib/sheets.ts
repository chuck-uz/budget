import { readFileSync } from "node:fs";
import { google } from "googleapis";

const SPREADSHEET_ID = process.env.BUDGET_SPREADSHEET_ID ?? "";

// Диапазоны листов «Бюджета» (см. README → «Данные»).
const RANGES = {
  operations: "Операции!A2:G", // заголовок в строке 1 → читаем со 2-й
  categories: "Категории!A1:B", // без заголовка — данные с 1-й строки
  rates: "Курсы!E2:F", // история курса: Дата | Курс, заголовок в строке 1
} as const;

function loadCredentials(): Record<string, unknown> {
  const b64 = process.env.GOOGLE_SA_JSON_B64;
  if (b64) return JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
  const file = process.env.GOOGLE_SA_JSON_FILE;
  if (file) return JSON.parse(readFileSync(file, "utf8"));
  throw new Error(
    "Нет ключа сервис-аккаунта: задай GOOGLE_SA_JSON_B64 или GOOGLE_SA_JSON_FILE",
  );
}

async function sheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: loadCredentials(),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  return google.sheets({ version: "v4", auth });
}

export type SheetRow = (string | number | boolean | null)[];

export type RawSheets = {
  operations: SheetRow[];
  categories: SheetRow[];
  rates: SheetRow[];
};

/** Читает три листа одним batchGet. Числа приходят числами, даты — строкой dd.mm.yyyy. */
export async function fetchSheets(): Promise<RawSheets> {
  if (!SPREADSHEET_ID) throw new Error("Не задан BUDGET_SPREADSHEET_ID");
  const sheets = await sheetsClient();
  const res = await sheets.spreadsheets.values.batchGet({
    spreadsheetId: SPREADSHEET_ID,
    ranges: [RANGES.operations, RANGES.categories, RANGES.rates],
    valueRenderOption: "UNFORMATTED_VALUE",
    dateTimeRenderOption: "FORMATTED_STRING",
  });
  const [operations, categories, rates] = (res.data.valueRanges ?? []).map(
    (v) => (v.values ?? []) as SheetRow[],
  );
  return {
    operations: operations ?? [],
    categories: categories ?? [],
    rates: rates ?? [],
  };
}
