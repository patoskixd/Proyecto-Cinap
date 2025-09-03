"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Category, CategoryId, Service } from "@domain/scheduling";
import type { WeekdayId, SlotRule } from "@domain/slots";
import { normalizeSchedules, type UIRule } from "@application/slots/usecases/NormalizeSchedules";

type Props = {
  categories: Category[];
  servicesByCategory: Record<CategoryId, Service[]>;
  times: string[];
};

function cx(...xs: Array<string | false | undefined>) {
  return xs.filter(Boolean).join(" ");
}

const DAY_LABEL: Record<WeekdayId, string> = {
  monday: "Lunes",
  tuesday: "Martes",
  wednesday: "Miércoles",
  thursday: "Jueves",
  friday: "Viernes",
};

const WEEKDAYS_UI = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const weekIndexMon0 = (d: Date) => (d.getDay() + 6) % 7;

const isSameDay = (a: Date | null, b: Date | null) =>
  !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const today = startOfDay(new Date());
const isPastDate = (d: Date) => startOfDay(d) < today;

const monthLabelES = (d: Date) =>
  d.toLocaleDateString("es-ES", { month: "long", year: "numeric" });

function buildMonthGrid(month: Date) {
  const y = month.getFullYear();
  const m = month.getMonth();
  const first = new Date(y, m, 1);
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const startOffset = weekIndexMon0(first);

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(y, m, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function weekdayFromDate(d: Date): WeekdayId | null {
  const w = weekIndexMon0(d);
  return w > 4 ? null : (["monday", "tuesday", "wednesday", "thursday", "friday"][w] as WeekdayId);
}

function toLocalISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dateFromLocalISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

const formatEsDate = (iso: string) =>
  dateFromLocalISO(iso)
    .toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })
    .replace(",", "");


export default function CreateSlotsWizard({
  categories,
  servicesByCategory,
  times,
}: Props) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);


  const [categoryId, setCategoryId] = useState<CategoryId | undefined>();
  const [serviceId, setServiceId] = useState<string | undefined>();


  const [location, setLocation] = useState("");
  const [room, setRoom] = useState("");
  const [roomNotes, setRoomNotes] = useState("");

  const [schedules, setSchedules] = useState<UIRule[]>([]);


  const [showSuccess, setShowSuccess] = useState(false);
  const [createdCount, setCreatedCount] = useState<number>(0);

 
  const services = useMemo<Service[]>(() => {
    return categoryId ? servicesByCategory[categoryId] ?? [] : [];
  }, [categoryId, servicesByCategory]);

  const selectedService = services.find((s) => s.id === serviceId);
  const durationMin = selectedService ? parseInt(selectedService.duration, 10) || 60 : 60;


  const Progress = () => (
    <div className="flex items-center justify-center gap-3 border-b border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 px-6 py-5">
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
            {label}
          </span>
          {i < 3 && <div className="h-[2px] w-10 bg-slate-200 md:w-20" />}
        </div>
      ))}
    </div>
  );

  /* -------- Step 1 -------- */
  const renderStep1 = () => (
    <div className="space-y-10 p-6 md:p-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-neutral-900">Selecciona categoría y servicio</h2>
        <p className="text-neutral-600">Elige la categoría y el tipo de servicio para tus cupos</p>
      </div>

      <section>
        <h3 className="mb-4 border-b-2 border-slate-200 pb-2 text-lg font-semibold text-neutral-900">
          1. Categoría
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setCategoryId(c.id);
                setServiceId(undefined);
              }}
              className={cx(
                "rounded-2xl border-2 p-5 text-left transition hover:-translate-y-1 hover:shadow-md",
                categoryId === c.id ? "border-blue-600 bg-blue-50/40" : "border-slate-200 bg-white"
              )}
            >
              <div className="mb-2 text-3xl">{c.icon}</div>
              <h4 className="font-semibold text-neutral-900">{c.name}</h4>
              <p className="text-sm text-neutral-600">{c.description}</p>
            </button>
          ))}
        </div>
      </section>

      {categoryId && (
        <section>
          <h3 className="mb-4 border-b-2 border-slate-200 pb-2 text-lg font-semibold text-neutral-900">
            2. Servicio
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {services.map((s) => (
              <button
                key={s.id}
                onClick={() => setServiceId(s.id)}
                className={cx(
                  "rounded-2xl border-2 p-5 text-left transition hover:-translate-y-1 hover:shadow-md",
                  serviceId === s.id ? "border-blue-600 bg-blue-50/40" : "border-slate-200 bg-white"
                )}
              >
                <h4 className="font-semibold text-neutral-900">{s.name}</h4>
                <p className="text-sm text-neutral-600">{s.description}</p>
                <span className="mt-3 inline-block rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-600">
                  {s.duration}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );

  /* -------- Step 2 -------- */
  const renderStep2 = () => (
    <div className="space-y-6 p-6 md:p-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-neutral-900">Información de la sala</h2>
        <p className="text-neutral-600">Ingresa los detalles del lugar donde se realizarán las asesorías</p>
      </div>

      <div className="mx-auto flex max-w-[600px] flex-col gap-6">
        <div>
          <label className="mb-1 block text-sm font-semibold text-neutral-900">Ubicación</label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Ej: Edificio CT — Piso 4, Campus Central"
            className="w-full rounded-xl border-2 border-slate-300 bg-white p-3 text-neutral-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          <small className="text-slate-500">Indica el edificio, piso o área general</small>
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-neutral-900">Sala específica</label>
          <input
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            placeholder="Ej: CT-428"
            className="w-full rounded-xl border-2 border-slate-300 bg-white p-3 text-neutral-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          <small className="text-slate-500">Número de sala, oficina o espacio específico</small>
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-neutral-900">
            Notas adicionales (opcional)
          </label>
          <textarea
            value={roomNotes}
            onChange={(e) => setRoomNotes(e.target.value)}
            placeholder="Instrucciones especiales, referencias para encontrar la sala, etc."
            className="w-full min-h-[100px] rounded-xl border-2 border-slate-300 bg-white p-3 text-neutral-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>
    </div>
  );

  /* -------- Step 3 -------- */
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [multiSelected, setMultiSelected] = useState<Record<string, boolean>>({});
  const monthCells = useMemo(() => buildMonthGrid(currentMonth), [currentMonth]);

  const toggleDate = (d: Date) => {
    setSelectedDate(d);
    const key = toLocalISO(d);
    setMultiSelected((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const [singleStart, setSingleStart] = useState("09:00");
  const [singleEnd, setSingleEnd] = useState("16:00");
  const [multiStart, setMultiStart] = useState("09:00");
  const [multiEnd, setMultiEnd] = useState("16:00");

 
  const addSingleFromDate = () => {
    if (!selectedDate) return;
    const day = weekdayFromDate(selectedDate);
    if (!day) return;
    setSchedules((xs) => [
      ...xs,
      { day, startTime: singleStart, endTime: singleEnd, type: "single", isoDate: toLocalISO(selectedDate) },
    ]);
  };

  const addForSelectedDates = () => {
    const entries = Object.entries(multiSelected).filter(([, v]) => v);
    if (entries.length === 0) return;

    setSchedules((xs) => {
      const toAppend: UIRule[] = [];
      for (const [iso] of entries) {
        const d = dateFromLocalISO(iso);
        const day = weekdayFromDate(d);
        if (!day) continue;
        toAppend.push({ day, startTime: multiStart, endTime: multiEnd, type: "multiple", isoDate: iso });
      }
      return [...xs, ...toAppend];
    });
  };

  const removeSchedule = (idx: number) => setSchedules((xs) => xs.filter((_, i) => i !== idx));

 
  const normalized = useMemo(() => normalizeSchedules(schedules), [schedules]);

  const renderStep3 = () => {
    const selectedCount = Object.values(multiSelected).filter(Boolean).length;
    const labelDiaSeleccionado = selectedDate
      ? selectedDate
          .toLocaleDateString("es-ES", { weekday: "long", day: "2-digit", month: "short" })
          .replace(",", "")
      : "—";

    return (
      <div className="space-y-8 p-6 md:p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-neutral-900">Configura tus horarios</h2>
          <p className="text-neutral-600">
            Selecciona fechas y define horarios (individual o múltiples fechas)
          </p>
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
              {WEEKDAYS_UI.map((w) => (
                <div key={w} className="p-3">
                  {w}
                </div>
              ))}
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
              <div className="mb-3 capitalize text-lg font-bold text-neutral-900">
                {labelDiaSeleccionado}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-neutral-900">Hora inicio</label>
                  <select
                    value={singleStart}
                    onChange={(e) => setSingleStart(e.target.value)}
                    className="w-full rounded-lg border-2 border-slate-300 bg-white p-2 text-neutral-900"
                  >
                    {times.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-neutral-900">Hora fin</label>
                  <select
                    value={singleEnd}
                    onChange={(e) => setSingleEnd(e.target.value)}
                    className="w-full rounded-lg border-2 border-slate-300 bg-white p-2 text-neutral-900"
                  >
                    {times.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <button
                onClick={addSingleFromDate}
                className="mt-4 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 px-4 py-2 font-semibold text-white"
              >
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
                  <select
                    value={multiStart}
                    onChange={(e) => setMultiStart(e.target.value)}
                    className="w-full rounded-lg border-2 border-slate-300 bg-white p-2 text-neutral-900"
                  >
                    {times.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-neutral-900">Hora fin</label>
                  <select
                    value={multiEnd}
                    onChange={(e) => setMultiEnd(e.target.value)}
                    className="w-full rounded-lg border-2 border-slate-300 bg-white p-2 text-neutral-900"
                  >
                    {times.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <button
                onClick={addForSelectedDates}
                className="mt-4 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 px-4 py-2 font-semibold text-white"
              >
                Agregar a todas las fechas marcadas
              </button>
            </div>

            {/* Resumen (usa reglas normalizadas) */}
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
                        <div className="font-semibold text-neutral-900">
                          {s.isoDate ? formatEsDate(s.isoDate) : DAY_LABEL[s.day]}
                        </div>
                        <div className="text-sm text-neutral-700">
                          {s.startTime} - {s.endTime}
                        </div>
                      </div>
                      <button onClick={() => removeSchedule(i)} className="rounded-md bg-rose-500 px-2 py-1 text-white hover:bg-rose-600">
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* -------- Step 4 -------- */
  const toMin = (hhmm: string) => {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
  };
  const slotsFor = (start: string, end: string) =>
    Math.max(0, Math.floor((toMin(end) - toMin(start)) / durationMin));

  const normalizedForSubmit = normalized; 
  const totalSlots = useMemo(
    () => normalizedForSubmit.merged.reduce((acc, s) => acc + slotsFor(s.startTime, s.endTime), 0),
    [normalizedForSubmit.merged, durationMin]
  );

  const renderStep4 = () => (
    <div className="space-y-8 p-6 md:p-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-neutral-900">Confirma tus cupos</h2>
        <p className="text-neutral-600">Revisa la información antes de crear los cupos</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-6">
          <h3 className="mb-4 border-b-2 border-slate-200 pb-2 text-lg font-semibold text-neutral-900">
            Resumen
          </h3>
          <dl className="divide-y divide-slate-200">
            <Row label="Categoría" value={categories.find((c) => c.id === categoryId)?.name ?? "-"} />
            <Row label="Servicio" value={selectedService?.name ?? "-"} />
            <Row label="Duración" value={selectedService?.duration ?? "-"} />
            <Row label="Ubicación" value={location || "-"} />
            <Row label="Sala" value={room || "-"} />
            {roomNotes && <Row label="Notas" value={roomNotes} />}
          </dl>
        </div>

        <div className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-6">
          <h3 className="mb-4 border-b-2 border-slate-200 pb-2 text-lg font-semibold text-neutral-900">
            Horarios configurados
          </h3>
          <div className="space-y-2">
            {normalizedForSubmit.merged.map((s, i) => (
              <div key={`${s.isoDate ?? s.day}-${i}`} className="flex items-center justify-between rounded-lg border bg-white px-3 py-2">
                <div>
                  <div className="font-semibold text-neutral-900">
                    {s.isoDate ? formatEsDate(s.isoDate) : DAY_LABEL[s.day]}
                  </div>
                  <div className="text-sm text-neutral-700">
                    {s.startTime} - {s.endTime}
                  </div>
                </div>
                <div className="text-sm font-semibold text-blue-700">
                  {slotsFor(s.startTime, s.endTime)} cupos
                </div>
              </div>
            ))}
            <div className="rounded-lg bg-blue-50 p-3 text-center text-blue-700">
              <strong>Total de cupos a crear: {totalSlots}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  /* -------- Nav ---------- */
  const prev = () => setStep((s) => (s === 1 ? 1 : ((s - 1) as 1 | 2 | 3 | 4)));
  const next = () => setStep((s) => (s === 4 ? 4 : ((s + 1) as 1 | 2 | 3 | 4)));

  const canNext =
    (step === 1 && !!categoryId && !!serviceId) ||
    (step === 2 && !!location.trim() && !!room.trim()) ||
    (step === 3 && normalized.merged.length > 0);

  const submit = async () => {
    setCreatedCount(totalSlots);
    setShowSuccess(true);
  };

  return (
  <div className="mx-auto max-w-[1100px] space-y-6">
    {/* Encabezado de página */}
    <section className="rounded-2xl bg-white p-6 md:p-8 shadow-[0_10px_30px_rgba(0,0,0,0.06)] ring-1 ring-slate-100">
      <h1 className="text-3xl font-bold text-neutral-900">Abrir cupos</h1>
      <p className="mt-1 text-neutral-600">
        Configura los cupos que estarán disponibles para los estudiantes.
      </p>
    </section>

    {/* Wizard (sin cambios) */}
    <section className="mx-auto max-w-[900px] overflow-hidden rounded-2xl bg-white shadow-[0_10px_30px_rgba(0,0,0,0.08)] ring-1 ring-slate-100">
      <Progress />

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}

      {/* Navegación */}
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

      {/* Modal éxito */}
      {showSuccess && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
            <div className="mb-2 text-5xl">✅</div>
            <h3 className="text-lg font-bold text-neutral-900">¡Cupos creados exitosamente!</h3>
            <p className="mt-1 text-sm text-neutral-600">
              Se generaron <strong>{createdCount}</strong> cupos de asesoría.
            </p>
            <Link
              href="/dashboard?role=advisor"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 px-6 py-3 font-semibold text-white shadow-sm transition"
            >
              Ir al Dashboard
            </Link>
            <button
              onClick={() => setShowSuccess(false)}
              className="mt-2 block w-full text-sm font-semibold text-neutral-500 hover:text-neutral-700"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </section>
  </div>
);

}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[140px_1fr] items-start gap-4 py-3">
      <dt className="text-sm font-medium text-neutral-700">{label}</dt>
      <dd className="text-sm font-semibold text-neutral-900">{value}</dd>
    </div>
  );
}
