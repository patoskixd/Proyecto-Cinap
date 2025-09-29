"use client";
import { cx } from "../utils/cx";

type Props = { step: 1|2|3|4 };
export default function Progress({ step }: Props) {
  return (
    <div className="flex items-center justify-center gap-3 border-b border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 px-6 py-5">
      {[
        { n: 1, label: "Servicio" },
        { n: 2, label: "Sala" },
        { n: 3, label: "Horarios" },
        { n: 4, label: "Confirmar" },
      ].map(({ n, label }, i) => (
        <div key={n} className="flex items-center gap-3">
          <div
            className={cx(
              "flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold",
              step === n && "bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-md",
              step > n && "bg-gradient-to-br from-yellow-500 to-yellow-600 text-white shadow-sm",
              step < n && "bg-slate-200 text-slate-600"
            )}
          >
            {n}
          </div>
          <span
            className={cx(
              "hidden text-sm font-semibold md:inline",
              step === n && "text-blue-700",
              step > n && "text-yellow-700",
              step < n && "text-slate-500"
            )}
          >
            {label}
          </span>
          {i < 3 && <div className={cx("h-[2px] w-10 md:w-20", step > n ? "bg-yellow-300" : "bg-slate-200")} />}
        </div>
      ))}
    </div>
  );
}
