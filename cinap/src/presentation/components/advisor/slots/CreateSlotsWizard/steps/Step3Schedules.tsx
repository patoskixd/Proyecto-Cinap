"use client";
import { useMemo, useState } from "react";
import { normalizeSchedules, type UIRule } from "@application/slots/usecases/NormalizeSchedules";
import {
  WEEKDAYS_UI,
  buildMonthGrid,
  isPastDate,
  isSameDay,
  monthLabelES,
  toLocalISO,
  dateFromLocalISO,
  weekIndexMon0,
  weekdayFromDate,
} from "../../CreateSlotsWizard/utils/date";
import { cx } from "../../CreateSlotsWizard/utils/cx";

type Props = {
  times: string[];
  schedules: UIRule[];
  setSchedules(upd: (xs: UIRule[]) => UIRule[] | UIRule[]): void;
};

export default function Step3Schedules({ times, schedules, setSchedules }: Props) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [multiSelected, setMultiSelected] = useState<Record<string, boolean>>({});
  const monthCells = useMemo(() => buildMonthGrid(currentMonth), [currentMonth]);

  const [singleStart, setSingleStart] = useState("09:00");
  const [singleEnd, setSingleEnd] = useState("16:00");
  const [multiStart, setMultiStart] = useState("09:00");
  const [multiEnd, setMultiEnd] = useState("16:00");

  const toggleDate = (d: Date) => {
    setSelectedDate(d);
    const key = toLocalISO(d);
    setMultiSelected((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const addSingleFromDate = () => {
    if (!selectedDate) return;
    const day = weekdayFromDate(selectedDate);
    if (!day) return;
    setSchedules((xs: UIRule[]) => [
      ...xs,
      { day, startTime: singleStart, endTime: singleEnd, isoDate: toLocalISO(selectedDate) },
    ]);
  };

  const addForSelectedDates = () => {
    const entries = Object.entries(multiSelected).filter(([, v]) => v);
    if (entries.length === 0) return;

    setSchedules((xs: UIRule[]) => {
      const toAppend: UIRule[] = [];
      for (const [iso] of entries) {
        const d = dateFromLocalISO(iso);
        const day = weekdayFromDate(d);
        if (!day) continue;
        toAppend.push({ day, startTime: multiStart, endTime: multiEnd, isoDate: iso });
      }
      return [...xs, ...toAppend];
    });
  };

  const removeSchedule = (idx: number) => setSchedules((xs: UIRule[]) => xs.filter((_, i) => i !== idx));
  const normalized = useMemo(() => normalizeSchedules(schedules), [schedules]);

  const labelDiaSeleccionado = selectedDate
    ? selectedDate.toLocaleDateString("es-ES", { weekday: "long", day: "2-digit", month: "short" }).replace(",", "")
    : "—";

  return (
    <div className="space-y-8 p-6 md:p-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-neutral-900">Configura tus horarios</h2>
        <p className="text-neutral-600">Selecciona fechas y define horarios (individual o múltiples fechas)</p>
      </div>

      <div className="grid gap-6 md:grid-cols-[1.1fr_1fr]">
        {/* Calendario */}
        <div className="overflow-hidden rounded-2xl border-2 border-slate-200 bg-white">
          <div className="flex items-center justify-center gap-2 p-3">
            <button
              onClick={() => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
              className="rounded-lg border-2 border-slate-300 px-3 py-2 text-sm font-semibold text-neutral-900 transition hover:border-blue-600 hover:text-blue-600"
            >
              ← Mes anterior
            </button>
            <span className="min-w-[220px] text-center text-lg font-semibold capitalize text-neutral-900">
              {monthLabelES(currentMonth)}
            </span>
            <button
              onClick={() => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
              className="rounded-lg border-2 border-slate-300 px-3 py-2 text-sm font-semibold text-neutral-900 transition hover:border-blue-600 hover:text-blue-600"
            >
              Mes siguiente →
            </button>
          </div>

          <div className="grid grid-cols-7 border-t-2 border-slate-200 bg-slate-50 text-center text-sm font-semibold text-neutral-900">
            {WEEKDAYS_UI.map((w) => <div key={w} className="p-3">{w}</div>)}
          </div>

          <div className="grid grid-cols-7 gap-1 p-2 md:gap-2 md:p-3">
            {monthCells.map((cell, idx) => {
              if (!cell) return <div key={`empty-${idx}`} className="h-10 rounded-lg bg-transparent md:h-12" />;
              const weekend = weekIndexMon0(cell) > 4;
              const past = isPastDate(cell);
              const selected = isSameDay(cell, selectedDate);
              const key = toLocalISO(cell);
              const multiMarked = !!multiSelected[key];

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => !past && !weekend && toggleDate(cell)}
                  disabled={past || weekend}
                  className={cx(
                    "relative flex h-10 w-full items-center justify-center rounded-lg border text-[15px] font-bold transition md:h-12",
                    past && "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400",
                    weekend && !past && "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400",
                    !past && !weekend && !selected && !multiMarked && "border-slate-300 bg-white text-neutral-900 hover:border-blue-600",
                    selected && "border-blue-600 bg-blue-100 text-blue-900 ring-1 ring-blue-300",
                    multiMarked && !selected && "border-blue-300 bg-blue-50 text-blue-800"
                  )}
                >
                  {cell.getDate()}
                </button>
              );
            })}
          </div>
        </div>

        {/* Panel de horarios */}
        <div className="space-y-5">
          {/* Individual */}
          <div className="rounded-2xl border-2 border-slate-200 bg-white p-5">
            <div className="mb-2 text-sm font-semibold text-neutral-500">Horario para:</div>
            <div className="mb-3 capitalize text-lg font-bold text-neutral-900">{labelDiaSeleccionado}</div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-900">Hora inicio</label>
                <select value={singleStart} onChange={(e) => setSingleStart(e.target.value)} className="w-full rounded-lg border-2 border-slate-300 bg-white p-2 text-neutral-900">
                  {times.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-900">Hora fin</label>
                <select value={singleEnd} onChange={(e) => setSingleEnd(e.target.value)} className="w-full rounded-lg border-2 border-slate-300 bg-white p-2 text-neutral-900">
                  {times.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <button onClick={addSingleFromDate} className="mt-4 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 px-4 py-2 font-semibold text-white">
              Agregar horario a la fecha seleccionada
            </button>
          </div>

          {/* Múltiples fechas */}
          <div className="rounded-2xl border-2 border-slate-200 bg-white p-5">
            <div className="mb-2 text-sm font-semibold text-neutral-500">
              Fechas marcadas: <span className="text-neutral-900">{Object.values(multiSelected).filter(Boolean).length}</span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-900">Hora inicio</label>
                <select value={multiStart} onChange={(e) => setMultiStart(e.target.value)} className="w-full rounded-lg border-2 border-slate-300 bg-white p-2 text-neutral-900">
                  {times.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-900">Hora fin</label>
                <select value={multiEnd} onChange={(e) => setMultiEnd(e.target.value)} className="w-full rounded-lg border-2 border-slate-300 bg-white p-2 text-neutral-900">
                  {times.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <button onClick={addForSelectedDates} className="mt-4 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 px-4 py-2 font-semibold text-white">
              Agregar a todas las fechas marcadas
            </button>
          </div>

          {/* Resumen */}
          <div className="rounded-2xl border-2 border-slate-200 bg-white p-5">
            <h3 className="mb-3 text-lg font-semibold text-neutral-900">Horarios configurados</h3>
            {normalized.merged.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center text-slate-500">
                No has configurado horarios aún
              </div>
            ) : (
              <ul className="space-y-2">
                {normalized.merged.map((s, i) => (
                  <li key={`${s.isoDate ?? s.day}-${i}`} className="flex items-center justify-between rounded-lg border bg-slate-50 px-3 py-2">
                    <div>
                      <div className="font-semibold text-neutral-900">{s.isoDate ?? s.day}</div>
                      <div className="text-sm text-neutral-700">{s.startTime} - {s.endTime}</div>
                    </div>
                    <button onClick={() => removeSchedule(i)} className="rounded-md bg-rose-500 px-2 py-1 text-white hover:bg-rose-600">×</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
