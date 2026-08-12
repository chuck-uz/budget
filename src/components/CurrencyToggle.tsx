"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { buildQuery } from "@/lib/params";
import type { Currency } from "@/lib/money";

export function CurrencyToggle({ value }: { value: Currency }) {
  const router = useRouter();
  const params = useSearchParams();

  const set = (currency: Currency) => {
    if (currency === value) return;
    router.push(buildQuery(params, { currency }));
  };

  return (
    <div className="inline-flex rounded-lg border border-white/10 bg-white/5 p-0.5 text-sm">
      {(["SUM", "USD"] as const).map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => set(c)}
          aria-pressed={value === c}
          className={`h-9 min-w-11 rounded-md px-3 font-medium transition-colors ${
            value === c
              ? "bg-white text-black"
              : "text-white/60 hover:text-white"
          }`}
        >
          {c === "SUM" ? "Сум" : "USD"}
        </button>
      ))}
    </div>
  );
}
