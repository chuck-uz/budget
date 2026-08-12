// Запускается один раз при старте сервера (Next.js instrumentation).
// Планировщик отвязан от googleapis: просто дёргает защищённый /api/sync по HTTP.
// Так тяжёлый Node-пакет не попадает в bundle instrumentation.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const token = process.env.SYNC_TOKEN;
  if (!token) {
    console.warn("[sync] SYNC_TOKEN не задан — авто-синхрон выключен");
    return;
  }
  const intervalMin = Number(process.env.SYNC_INTERVAL_MIN ?? "10");
  const port = process.env.PORT ?? "3000";
  const url = `http://127.0.0.1:${port}/api/sync`;
  let running = false;

  const tick = async () => {
    if (running) return; // защита от наложения
    running = true;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { authorization: `Bearer ${token}` },
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) console.log("[sync] ok", body);
      else console.error(`[sync] ${res.status}`, body);
    } catch (e) {
      console.error("[sync] failed:", e instanceof Error ? e.message : e);
    } finally {
      running = false;
    }
  };

  setTimeout(tick, 5000); // первый прогон после того, как сервер начал слушать
  if (intervalMin > 0) setInterval(tick, intervalMin * 60_000);
}
