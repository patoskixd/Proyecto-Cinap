"use client";

import { cx } from "../utils/cx";

export function FooterNav({
  step,
  submitting,
  canGoNext,
  onPrev,
  onNext,
  onConfirm,
}: {
  step: 1 | 2 | 3;
  submitting: boolean;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5 md:flex-row">
      <button
        type="button"
        onClick={onPrev}
        disabled={step <= 1 || submitting}
        className={cx(
          "inline-flex items-center gap-2 rounded-full border-2 px-5 py-2 font-semibold transition",
          "disabled:cursor-not-allowed disabled:opacity-50",
          step > 1
            ? "border-slate-200 text-neutral-700 hover:border-blue-600 hover:text-blue-600"
            : "border-slate-100 text-slate-300"
        )}
      >
        ← Anterior
      </button>

      {step < 3 ? (
        <button
          type="button"
          onClick={onNext}
          disabled={!canGoNext || submitting}
          className={cx(
            "inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 px-6 py-3 font-semibold text-white shadow-sm transition",
            "disabled:opacity-60"
          )}
        >
          Siguiente →
        </button>
      ) : (
        <button
          type="button"
          onClick={onConfirm}
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 px-6 py-3 font-semibold text-white shadow-sm transition disabled:opacity-60"
        >
          {submitting ? "Confirmando…" : "Confirmar Asesoría"}
        </button>
      )}
    </div>
  );
}
