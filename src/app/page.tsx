export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center gap-4 px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Бюджет — дашборд</h1>
      <p className="text-[15px] leading-relaxed opacity-70">
        Скелет готов. Дальше: синхронизация из Google-таблицы в Postgres, вход,
        API-агрегации и дашборд (KPI · категории · фильтры · таблица · Сум/USD).
      </p>
      <div className="mt-2 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs opacity-70">
        v1 · фаза 1: скелет
      </div>
    </main>
  );
}
