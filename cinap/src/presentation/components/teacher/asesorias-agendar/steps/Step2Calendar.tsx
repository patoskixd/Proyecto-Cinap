"use client";

import type { FoundSlot } from "@/domain/scheduling";
import type { WizardState } from "../types";
import { WEEKDAYS, buildMonthGrid, isPastDate, isSameDay, monthLabelES, weekIndexMon0 } from "../utils/date";
import { cx } from "../utils/cx";

export function Step2Calendar({
  currentMonth,
  setCurrentMonth,
  selectedDate,
  setSelectedDate,
  state,
  openSlots,
  loading,
  error,
  onSelectSlot,
}: {
  currentMonth: Date;
  setCurrentMonth: (d: Date) => void;
  selectedDate: Date | null;
  setSelectedDate: (d: Date | null) => void;
  state: WizardState;
  openSlots: FoundSlot[];
  loading: boolean;
  error: string | null;
  onSelectSlot: (slot: FoundSlot) => void;
}) {
  const monthCells = buildMonthGrid(currentMonth);
  const isWeekendSelected = selectedDate ? weekIndexMon0(selectedDate) > 4 : false;
  const labelDiaSeleccionado = selectedDate
    ? selectedDate.toLocaleDateString("es-ES", { weekday: "long", day: "2-digit", month: "short" })
    : "—";

  const goPrevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const goNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  return (
    <div className="space-y-6 p-6 md:p-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-neutral-900">Selecciona fecha y hora</h2>
        <p className="text-neutral-600">Elige el horario que mejor se adapte a tu disponibilidad</p>
      </div>

      {/* Controles de mes */}
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={goPrevMonth}
          className="rounded-lg border-2 border-slate-200 px-3 py-2 text-sm font-semibold text-neutral-700 transition hover:border-blue-600 hover:text-blue-600"
        >
          ← Mes anterior
        </button>
        <span className="min-w-[200px] text-center text-lg font-semibold capitalize text-neutral-900">
          {monthLabelES(currentMonth)}
        </span>
        <button
          type="button"
          onClick={goNextMonth}
          className="rounded-lg border-2 border-slate-200 px-3 py-2 text-sm font-semibold text-neutral-700 transition hover:border-blue-600 hover:text-blue-600"
        >
          Mes siguiente →
        </button>
      </div>

      {/* Calendario + horarios */}
      <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
        {/* Calendario mensual */}
        <div className="overflow-hidden rounded-2xl border-2 border-slate-200 bg-white">
          <div className="grid grid-cols-7 border-b-2 border-slate-200 bg-slate-50 text-center text-sm font-semibold">
            {WEEKDAYS.map((w) => (
              <div key={w} className="p-3">
                {w}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 p-2 md:gap-2 md:p-3">
            {monthCells.map((cell, idx) => {
              if (!cell) return <div key={`empty-${idx}`} className="h-10 rounded-lg bg-transparent md:h-12" />;
              const isTodayCell = isSameDay(cell, new Date()) && cell.getMonth() === currentMonth.getMonth();
              const selected = isSameDay(cell, selectedDate);
              const weekend = weekIndexMon0(cell) > 4;
              const past = isPastDate(cell);

              return (
                <button
                  key={cell.toISOString()}
                  type="button"
                  onClick={() => !past && setSelectedDate(cell)}
                  disabled={past}
                  className={cx(
                    "flex h-10 w-full items-center justify-center rounded-lg border text-[15px] font-bold text-neutral-800 transition md:h-12",
                    past && "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400",
                    !past && !selected && weekend && "border-slate-100 bg-slate-50 text-neutral-600",
                    !past && !selected && !weekend && "border-slate-200 bg-white hover:border-blue-600",
                    selected && !past && "border-blue-500 bg-blue-100 text-blue-800 ring-1 ring-blue-300",
                    isTodayCell && !selected && !past && "border-blue-300 bg-blue-50 text-blue-800"
                  )}
                >
                  {cell.getDate()}
                </button>
              );
            })}
          </div>
        </div>

        {/* Horas del día seleccionado */}
        <div className="rounded-2xl border-2 border-slate-200 bg-white p-4 md:p-5">
          <div className="mb-3 text-center md:text-left">
            <div className="text-sm font-semibold text-neutral-500">Horarios para:</div>
            <div className="capitalize text-lg font-bold text-neutral-900">{labelDiaSeleccionado}</div>
          </div>

          {!selectedDate ? (
            <p className="text-center text-sm text-neutral-500">Selecciona un día del calendario.</p>
          ) : isWeekendSelected ? (
            <p className="rounded-lg bg-slate-50 p-3 text-center text-sm text-neutral-500">
              No hay disponibilidad los fines de semana.
            </p>
          ) : loading ? (
            <p className="text-center text-sm text-neutral-500">Cargando cupos disponibles…</p>
          ) : error ? (
            <p className="text-center text-sm text-rose-600">{error}</p>
          ) : openSlots.length === 0 ? (
            <p className="text-center text-sm text-neutral-500">No hay cupos disponibles para este día.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {openSlots.map((slot) => {
                const selected = state.slot?.cupoId === slot.cupoId;
                return (
                  <button
                    key={slot.cupoId}
                    type="button"
                    onClick={() => onSelectSlot(slot)}
                    className={cx(
                      "rounded-lg border px-3 py-2 text-center text-[15px] font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-200",
                      selected
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-300 bg-white text-neutral-900 hover:border-blue-600 hover:text-blue-700"
                    )}
                  >
                    {slot.time}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
