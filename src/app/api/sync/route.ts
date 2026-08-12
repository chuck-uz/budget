import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordSyncFailure, runSync } from "@/lib/sync";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/** Токен передаётся заголовком Authorization: Bearer <SYNC_TOKEN> (не в URL). */
function authorized(req: NextRequest): boolean {
  const token = process.env.SYNC_TOKEN;
  if (!token) return false;
  const auth = req.headers.get("authorization") ?? "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  return bearer.length > 0 && bearer === token;
}

// Ручной/крон-запуск синхрона.
export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const result = await runSync();
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await recordSyncFailure(message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

// Статус последнего синхрона (тоже под токеном).
export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const state = await prisma.syncState.findUnique({ where: { id: 1 } });
  return NextResponse.json(state ?? { ok: false, message: "синхрон ещё не выполнялся" });
}
