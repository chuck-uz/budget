"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { buildQuery } from "@/lib/params";
import type { OpType } from "@/lib/filters";

type Props = {
  from: string; // YYYY-MM-DD
  to: string;
  category: string | null;
  type: OpType;
  q: string;
  categories: string[];
  bounds: { min: string | null; max: string | null };
};

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const inputCls =
  "h-11 rounded-lg border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-white/30";

export function FilterBar(props: Props) {
  const router = useRouter();
  const params = useSearchParams();

  const push = (updates: Record<string, string | null>) =>
    router.push(buildQuery(params, updates, { resetPage: true }));

  const preset = (kind: "month" | "d30" | "all") => {
    const now = new Date();
    if (kind === "month") {
      const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
      push({ from: iso(from), to: iso(to) });
    } else if (kind === "d30") {
      const to = new Date();
      const from = new Date(Date.now() - 29 * 86400000);
      push({ from: iso(from), to: iso(to) });
    } else if (props.bounds.min && props.bounds.max) {
      push({ from: props.bounds.min, to: props.bounds.max });
    }
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    push({
      from: String(fd.get("from") ?? ""),
      to: String(fd.get("to") ?? ""),
      q: String(fd.get("q") ?? "").trim() || null,
    });
  };

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
      {/* Пресеты периода */}
      <div className="flex flex-wrap gap-2">
        {[
          { k: "month" as const, label: "Текущий месяц" },
          { k: "d30" as const, label: "30 дней" },
          { k: "all" as const, label: "Всё время" },
        ].map((p) => (
          <button
            key={p.k}
            type="button"
            onClick={() => preset(p.k)}
            className="h-9 rounded-full border border-white/10 bg-white/5 px-3 text-sm text-white/70 transition-colors hover:text-white"
          >
            {p.label}
          </button>
        ))}
      </div>

      <form
        onSubmit={onSubmit}
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6"
      >
        <label className="flex flex-col gap-1 lg:col-span-1">
          <span className="text-xs text-white/50">С даты</span>
          <input type="date" name="from" defaultValue={props.from} className={inputCls} />
        </label>
        <label className="flex flex-col gap-1 lg:col-span-1">
          <span className="text-xs text-white/50">По дату</span>
          <input type="date" name="to" defaultValue={props.to} className={inputCls} />
        </label>

        <label className="flex flex-col gap-1 lg:col-span-1">
          <span className="text-xs text-white/50">Тип</span>
          <select
            defaultValue={props.type}
            onChange={(e) => push({ type: e.target.value === "all" ? null : e.target.value })}
            className={inputCls}
          >
            <option value="all">Все</option>
            <option value="Доход">Доход</option>
            <option value="Расход">Расход</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 lg:col-span-1">
          <span className="text-xs text-white/50">Категория</span>
          <select
            defaultValue={props.category ?? ""}
            onChange={(e) => push({ category: e.target.value || null })}
            className={inputCls}
          >
            <option value="">Все</option>
            {props.categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 sm:col-span-2 lg:col-span-1">
          <span className="text-xs text-white/50">Поиск</span>
          <input
            type="search"
            name="q"
            defaultValue={props.q}
            placeholder="описание/категория"
            className={inputCls}
          />
        </label>

        <div className="flex items-end lg:col-span-1">
          <button
            type="submit"
            className="h-11 w-full rounded-lg bg-white px-4 text-sm font-medium text-black transition-opacity hover:opacity-90"
          >
            Применить
          </button>
        </div>
      </form>
    </section>
  );
}
