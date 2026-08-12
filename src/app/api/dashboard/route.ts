import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { getDashboard } from "@/lib/analytics";
import { normalizeFilters } from "@/lib/filters";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// JSON-агрегации дашборда под фильтры из query. Только для вошедшего пользователя.
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const params = Object.fromEntries(new URL(req.url).searchParams.entries());
  const f = normalizeFilters(params, new Date());
  const data = await getDashboard(f);
  return NextResponse.json({
    filters: {
      from: f.from.toISOString().slice(0, 10),
      to: f.to.toISOString().slice(0, 10),
      category: f.category,
      type: f.type,
      q: f.q,
      currency: f.currency,
      page: f.page,
      pageSize: f.pageSize,
    },
    ...data,
  });
}
