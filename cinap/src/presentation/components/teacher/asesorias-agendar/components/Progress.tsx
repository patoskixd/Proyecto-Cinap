"use client";

import { cx } from "../utils/cx";

export function Progress({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center justify-center gap-3 border-b border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 px-6 py-5">
      {[1, 2, 3].map((n, i) => (
        <div key={n} className="flex items-center gap-3">
          <div
            className={cx(
              "flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold",
              step === n && "bg-gradient-to-br from-blue-600 to-blue-700 text-white",
              step > n && "bg-emerald-500 text-white",
              step < n && "bg-slate-200 text-slate-600"
            )}
          >
            {n}
          </div>
          <span
            className={cx(
              "hidden text-sm font-semibold md:inline",
              step === n && "text-blue-700",
              step > n && "text-emerald-600",
              step < n && "text-slate-500"
            )}
          >
            {n === 1 ? "Seleccionar" : n === 2 ? "Agendar" : "Confirmar"}
          </span>
          {i < 2 && <div className="h-[2px] w-10 bg-slate-200 md:w-20" />}
        </div>
      ))}
    </div>
  );
}
