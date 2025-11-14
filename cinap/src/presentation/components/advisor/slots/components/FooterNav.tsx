"use client";

import { cx } from "../utils/cx";

type Props = {
  step: 1|2|3|4;
  canNext: boolean;
  prev(): void;
  next(): void;
  submit(): void;
};

export default function FooterNav({ step, canNext, prev, next, submit }: Props) {
  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5 md:flex-row">
      <button
        onClick={prev}
        disabled={step <= 1}
        className={cx(
          "inline-flex items-center gap-2 rounded-full border-2 px-5 py-2 font-semibold transition",
          "disabled:cursor-not-allowed disabled:opacity-50",
          step > 1
            ? "border-slate-200 text-neutral-800 hover:border-blue-600 hover:text-blue-600"
            : "border-slate-100 text-slate-300"
        )}
      >
        ← Anterior
      </button>

      {step < 4 ? (
        <button
          onClick={() => canNext && next()}
          disabled={!canNext}
          className={cx(
            "inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 px-6 py-3 font-semibold text-white shadow-sm transition",
            "disabled:opacity-60"
          )}
        >
          Siguiente →
        </button>
      ) : (
        <button
          onClick={submit}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 px-6 py-3 font-semibold text-white shadow-sm transition"
        >
          Crear Cupos
        </button>
      )}
    </div>
  );
}
