// Запускается один раз при старте сервера (Next.js instrumentation).
// Периодически тянет таблицу в Postgres. Внешний крон не нужен.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { runSync, recordSyncFailure } = await import("@/lib/sync");
  const intervalMin = Number(process.env.SYNC_INTERVAL_MIN ?? "10");
  let running = false;

  const tick = async () => {
    if (running) return; // защита от наложения
    running = true;
    try {
      const r = await runSync();
      console.log(
        `[sync] ok ops=${r.ops} cats=${r.categories} rates=${r.rates}`,
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.error("[sync] failed:", message);
      await recordSyncFailure(message);
    } finally {
      running = false;
    }
  };

  setTimeout(tick, 4000); // первый прогон вскоре после старта
  if (intervalMin > 0) setInterval(tick, intervalMin * 60_000);
}
