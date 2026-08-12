"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { buildQuery } from "@/lib/params";

export function Pagination({
  page,
  pageSize,
  total,
}: {
  page: number;
  pageSize: number;
  total: number;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const pages = Math.max(1, Math.ceil(total / pageSize));

  if (pages <= 1) return null;

  const go = (p: number) =>
    router.push(buildQuery(params, { page: p <= 1 ? null : String(p) }));

  const btn =
    "h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white/70 transition-colors enabled:hover:text-white disabled:opacity-40";

  return (
    <div className="flex items-center justify-between pt-1">
      <button
        type="button"
        className={btn}
        onClick={() => go(page - 1)}
        disabled={page <= 1}
      >
        ← Назад
      </button>
      <span className="text-xs text-white/40">
        стр. {page} из {pages}
      </span>
      <button
        type="button"
        className={btn}
        onClick={() => go(page + 1)}
        disabled={page >= pages}
      >
        Вперёд →
      </button>
    </div>
  );
}
