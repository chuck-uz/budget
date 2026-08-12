import { signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";

export const dynamic = "force-dynamic";

async function logout() {
  "use server";
  await signOut({ redirectTo: "/login" });
}

export default async function Home() {
  const session = await requireUser();
  const state = await prisma.syncState.findUnique({ where: { id: 1 } });

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center gap-6 px-6 py-16">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold tracking-tight">
            Бюджет — дашборд
          </h1>
          <p className="text-sm opacity-60">{session?.user?.email}</p>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm transition-opacity hover:opacity-80"
          >
            Выйти
          </button>
        </form>
      </div>

      <p className="text-[15px] leading-relaxed opacity-70">
        Вход работает. Данные синхронизируются из Google-таблицы в Postgres.
        Дальше: API-агрегации и сам дашборд (KPI · категории · фильтры · таблица ·
        Сум/USD).
      </p>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
        <div className="mb-1 font-medium opacity-80">Синхронизация</div>
        {state ? (
          <div className="opacity-70">
            {state.ok ? "✓ ок" : "✗ ошибка"} · операций: {state.ops} ·
            категорий: {state.categories} · курсов: {state.rates} ·{" "}
            {new Date(state.syncedAt).toLocaleString("ru-RU", {
              timeZone: "Asia/Tashkent",
            })}
            {state.message ? ` · ${state.message}` : ""}
          </div>
        ) : (
          <div className="opacity-70">ещё не выполнялась</div>
        )}
      </div>

      <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs opacity-70">
        v1 · фаза 3: вход
      </div>
    </main>
  );
}
