"use client";
import { useMemo, useState } from "react";
import { normalizeSchedules, type UIRule } from "@/application/advisor/slots/usecases/NormalizeSchedules";
import {
  WEEKDAYS_UI,
  buildMonthGrid,
  dateFromLocalISO,
  isPastDate,
  isSameDay,
  monthLabelES,
  toLocalISO,
  weekIndexMon0,
  weekdayFromDate,
} from "../utils/date";
import { cx } from "../utils/cx";

type Props = {
  times: string[];
  schedules: UIRule[];
  setSchedules(upd: (xs: UIRule[]) => UIRule[] | UIRule[]): void;
};

type Notice = { type: "error" | "success"; text: string } | null;

const toMinutes = (value: string): number => {
  const [h = "0", m = "0"] = value.split(":");
  return Number(h) * 60 + Number(m);
};

const formatIsoDate = (iso?: string) => {
  if (!iso) return "Repetición semanal";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("es-CL", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
};

export default function Step3Schedules({ times, schedules, setSchedules }: Props) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [multiSelected, setMultiSelected] = useState<Record<string, boolean>>({});

  const [singleStart, setSingleStart] = useState("09:00");
  const [singleEnd, setSingleEnd] = useState("18:00");
  const [breakEnabled, setBreakEnabled] = useState(false);
  const [breakStart, setBreakStart] = useState("13:00");
  const [breakEnd, setBreakEnd] = useState("14:00");
  const [notice, setNotice] = useState<Notice>(null);

  const monthCells = useMemo(() => buildMonthGrid(currentMonth), [currentMonth]);
  const normalized = useMemo(() => normalizeSchedules(schedules), [schedules]);
  const markedIsos = useMemo(
    () => Object.entries(multiSelected).filter(([, v]) => v).map(([iso]) => iso),
    [multiSelected],
  );
  const markedCount = markedIsos.length;

  const toggleDaySelection = (d: Date) => {
    if (isPastDate(d) || weekIndexMon0(d) > 4) return;
    const iso = toLocalISO(d);
    setMultiSelected((prev) => {
      const next = { ...prev };
      if (next[iso]) {
        delete next[iso];
      } else {
        next[iso] = true;
      }
      return next;
    });
    setSelectedDate(d);
    setNotice(null);
  };

  const clearMarked = () => {
    setMultiSelected({});
    setNotice(null);
  };

  const buildSegments = (): { segments?: Array<{ start: string; end: string }>; error?: string } => {
    const start = toMinutes(singleStart);
    const end = toMinutes(singleEnd);
    if (start >= end) {
      return { error: "La hora de término debe ser posterior a la hora de inicio." };
    }

    const segments: Array<{ start: string; end: string }> = [];
    if (breakEnabled) {
      const pauseStart = toMinutes(breakStart);
      const pauseEnd = toMinutes(breakEnd);
      if (pauseStart >= pauseEnd) {
        return { error: "La pausa debe tener un inicio anterior al término." };
      }
      if (pauseStart <= start || pauseEnd >= end) {
        return { error: "La pausa debe quedar dentro del horario principal." };
      }

      if (pauseStart > start) segments.push({ start: singleStart, end: breakStart });
      if (pauseEnd < end) segments.push({ start: breakEnd, end: singleEnd });

      if (segments.length === 0) {
        return { error: "La pausa cubre todo el horario. Ajusta los rangos." };
      }
    } else {
      segments.push({ start: singleStart, end: singleEnd });
    }

    return { segments };
  };

  const applySegmentsToDates = (
    segments: Array<{ start: string; end: string }>,
    isoList: string[],
  ): boolean => {
    if (!segments.length) return false;
    const uniqueIsos = Array.from(new Set(isoList));
    const validIsos = uniqueIsos.filter((iso) => {
      const d = dateFromLocalISO(iso);
      return !!weekdayFromDate(d);
    });
    if (validIsos.length === 0) {
      setNotice({ type: "error", text: "Selecciona fechas hábiles para copiar el horario." });
      return false;
    }

    setSchedules((prev: UIRule[]) => {
      const next = prev.filter((rule) => {
        if (!rule.isoDate) return true;
        if (!validIsos.includes(rule.isoDate)) return true;
        return !segments.some((segment) => rule.startTime === segment.start && rule.endTime === segment.end);
      });

      for (const iso of validIsos) {
        const d = dateFromLocalISO(iso);
        const day = weekdayFromDate(d);
        if (!day) continue;
        for (const segment of segments) {
          next.push({
            day,
            startTime: segment.start,
            endTime: segment.end,
            isoDate: iso,
          });
        }
      }
      return next;
    });
    return true;
  };

  const handleAddSchedule = () => {
    if (!selectedDate) {
      setNotice({ type: "error", text: "Selecciona una fecha hábil en el calendario." });
      return;
    }

    const day = weekdayFromDate(selectedDate);
    if (!day) {
      setNotice({ type: "error", text: "Solo puedes crear horarios de lunes a viernes." });
      return;
    }

    const { segments, error } = buildSegments();
    if (!segments) {
      setNotice(error ? { type: "error", text: error } : null);
      return;
    }

    const iso = toLocalISO(selectedDate);

    setSchedules((prev: UIRule[]) => {
      const filtered = prev.filter((rule) => {
        if (!rule.isoDate) return true;
        if (rule.isoDate !== iso) return true;
        return !segments.some((s) => rule.startTime === s.start && rule.endTime === s.end);
      });

      const nextRules = segments.map((segment) => ({
        day,
        startTime: segment.start,
        endTime: segment.end,
        isoDate: iso,
      }));

      return [...filtered, ...nextRules];
    });

    setNotice({
      type: "success",
      text: breakEnabled
        ? "Horario guardado. El bloque elegido quedará sin cupos."
        : "Horario agregado para la fecha seleccionada.",
    });
  };

  const removeSchedule = (rule: UIRule) => {
    setSchedules((prev: UIRule[]) =>
      prev.filter((item) => {
        if (rule.isoDate) {
          return !(
            item.isoDate === rule.isoDate &&
            item.startTime === rule.startTime &&
            item.endTime === rule.endTime
          );
        }
        return !(
          !item.isoDate &&
          item.day === rule.day &&
          item.startTime === rule.startTime &&
          item.endTime === rule.endTime
        );
      }),
    );
  };

  const handleApplyToMarked = () => {
    const { segments, error } = buildSegments();
    if (!segments) {
      setNotice(error ? { type: "error", text: error } : null);
      return;
    }

    if (markedCount === 0) {
      setNotice({ type: "error", text: "Marca al menos una fecha en el calendario." });
      return;
    }

    if (applySegmentsToDates(segments, markedIsos)) {
      setNotice({
        type: "success",
        text: `Horario copiado en ${markedCount} ${markedCount === 1 ? "fecha" : "fechas"}.`,
      });
    }
  };

  const labelDiaSeleccionado = selectedDate
    ? selectedDate.toLocaleDateString("es-CL", {
        weekday: "long",
        day: "2-digit",
        month: "long",
      })
    : "—";

  return (
    <div className="space-y-8 p-6 md:p-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-blue-900">Configura tus horarios</h2>
        <p className="text-blue-700">Selecciona una fecha, define el rango disponible y, si lo necesitas, marca una pausa sin cupos.</p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        {/* Calendario */}
        <div className="flex flex-col overflow-hidden rounded-2xl border-2 border-blue-200 bg-white shadow-lg">
          <div className="flex items-center justify-center gap-2 p-3 pb-2 bg-gradient-to-r from-blue-50 to-blue-100">
            <button
              onClick={() => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
              className="rounded-lg border-2 border-blue-300 px-3 py-2 text-sm font-semibold text-blue-900 transition hover:border-blue-600 hover:bg-blue-50"
            >
              ← Mes anterior
            </button>
            <span className="min-w-[220px] text-center text-lg font-semibold capitalize text-blue-900">
              {monthLabelES(currentMonth)}
            </span>
            <button
              onClick={() => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
              className="rounded-lg border-2 border-blue-300 px-3 py-2 text-sm font-semibold text-blue-900 transition hover:border-blue-600 hover:bg-blue-50"
            >
              Mes siguiente →
            </button>
          </div>

          <div className="grid grid-cols-7 border-t border-blue-200 bg-gradient-to-r from-blue-100 to-blue-50 text-center text-xs font-semibold uppercase tracking-wide text-blue-900">
            {WEEKDAYS_UI.map((w) => (
              <div key={w} className="p-3">
                {w}
              </div>
            ))}
          </div>

          <div className="p-3 pt-2">
            <div className="grid grid-cols-7 gap-1 md:gap-2">
            {monthCells.map((cell, idx) => {
              if (!cell) return <div key={`empty-${idx}`} className="h-10 rounded-lg bg-transparent md:h-12" />;
              const weekend = weekIndexMon0(cell) > 4;
              const past = isPastDate(cell);
              const key = toLocalISO(cell);
              const marked = !!multiSelected[key];
              const selected = selectedDate ? isSameDay(cell, selectedDate) : false;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleDaySelection(cell)}
                  disabled={past || weekend}
                  className={cx(
                    "relative flex h-10 w-full items-center justify-center rounded-lg border text-[15px] font-semibold transition md:h-12",
                    past && "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400",
                    weekend && !past && "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400",
                    !past && !weekend && !selected && !marked && "border-slate-300 bg-white text-neutral-900 hover:border-blue-600",
                    marked && !selected && "border-blue-300 bg-blue-50 text-blue-800",
                    selected && "border-blue-600 bg-gradient-to-br from-blue-100 to-blue-200 text-blue-900 shadow ring-1 ring-blue-300",
                  )}
                >
                  {cell.getDate()}
                </button>
              );
            })}
            </div>
          </div>
        </div>

        {/* Panel de horarios */}
        <div className="space-y-6">
          <div className="rounded-2xl border-2 border-blue-200 bg-white p-6 shadow-md space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wide text-blue-600">Horario para</span>
                <div className="text-lg font-bold text-blue-900 capitalize">{labelDiaSeleccionado}</div>
              </div>
              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                Selecciona un día en el calendario
              </span>
            </div>

            {markedCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700">
                <span className="font-semibold text-blue-800">{markedCount} fecha{markedCount === 1 ? "" : "s"} marcada{markedCount === 1 ? "" : "s"}</span>
                <button
                  type="button"
                  onClick={clearMarked}
                  className="rounded-full border border-blue-300 px-3 py-1 text-xs font-semibold text-blue-600 transition hover:border-blue-500 hover:text-blue-700"
                >
                  Limpiar selección
                </button>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-blue-900">Hora inicio</label>
                <select
                  value={singleStart}
                  onChange={(e) => setSingleStart(e.target.value)}
                  className="w-full rounded-lg border-2 border-blue-300 bg-white p-2 text-blue-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                >
                  {times.map((t) => (
                    <option key={`start-${t}`}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-blue-900">Hora fin</label>
                <select
                  value={singleEnd}
                  onChange={(e) => setSingleEnd(e.target.value)}
                  className="w-full rounded-lg border-2 border-blue-300 bg-white p-2 text-blue-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                >
                  {times.map((t) => (
                    <option key={`end-${t}`}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rounded-xl border border-yellow-200 bg-yellow-50/70 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-yellow-900">Bloques sin cupos (opcional)</h4>
                  <p className="text-xs text-yellow-700">Marca un bloque para pausas, colación u otros compromisos.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setBreakEnabled((v) => !v)}
                  className={cx(
                    "rounded-full px-3 py-1 text-xs font-semibold transition",
                    breakEnabled
                      ? "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow"
                      : "border border-yellow-300 bg-white text-yellow-700 hover:border-yellow-500",
                  )}
                >
                  {breakEnabled ? "Pausa activada" : "Agregar pausa"}
                </button>
              </div>

              {breakEnabled && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-yellow-900">Desde</label>
                    <select
                      value={breakStart}
                      onChange={(e) => setBreakStart(e.target.value)}
                      className="w-full rounded-lg border-2 border-yellow-300 bg-white p-2 text-yellow-900 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
                    >
                      {times.map((t) => (
                        <option key={`pause-start-${t}`}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-yellow-900">Hasta</label>
                    <select
                      value={breakEnd}
                      onChange={(e) => setBreakEnd(e.target.value)}
                      className="w-full rounded-lg border-2 border-yellow-300 bg-white p-2 text-yellow-900 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
                    >
                      {times.map((t) => (
                        <option key={`pause-end-${t}`}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {notice && (
              <div
                className={cx(
                  "rounded-lg px-3 py-2 text-sm font-medium",
                  notice.type === "error"
                    ? "border border-red-200 bg-red-50 text-red-700"
                    : "border border-emerald-200 bg-emerald-50 text-emerald-700",
                )}
              >
                {notice.text}
              </div>
            )}

            <button
              onClick={handleAddSchedule}
              className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 font-semibold text-white shadow transition hover:from-blue-700 hover:to-blue-800"
            >
              Guardar horario
            </button>
            <button
              onClick={handleApplyToMarked}
              disabled={markedCount === 0}
              className="w-full rounded-lg bg-gradient-to-r from-yellow-500 to-yellow-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:from-yellow-600 hover:to-yellow-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Guardar en fechas marcadas
            </button>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-5 shadow-md lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-blue-900">Horarios configurados</h3>
            {normalized.errors.length > 0 && (
              <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
                Revisa los rangos
              </span>
            )}
          </div>

          {normalized.merged.length === 0 ? (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-center text-blue-600">
              No has configurado horarios aún.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {normalized.merged.map((s, i) => {
                const isoKey = s.isoDate ?? s.day ?? String(i);
                const title = formatIsoDate(s.isoDate);
                return (
                  <div
                    key={`${isoKey}-${s.startTime}-${s.endTime}-${i}`}
                    className="flex items-center justify-between rounded-xl border border-blue-200 bg-white px-3 py-2 shadow-sm transition hover:border-blue-400 hover:shadow-md"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-blue-900">{title}</div>
                      <div className="text-xs font-medium text-blue-700">
                        {s.startTime} – {s.endTime}
                      </div>
                    </div>
                    <button
                      onClick={() => removeSchedule(s)}
                      className="ml-3 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow transition hover:from-rose-600 hover:to-rose-700"
                      aria-label="Eliminar horario"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
