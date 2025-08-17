// componente donde el usuario agenda una nueva asesoría 

"use client";

import { useMemo, useState, useEffect } from "react";
import type {
  Advisor,
  Category,
  CategoryId,
  Service,
  SlotSelection,
  WizardState,
} from "@/domain/scheduling";
import Link from "next/link";

function classNames(...xs: (string | false | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}
// Componente principal del asistente de agendamiento de asesorías
export default function ScheduleWizard(props: {
  categories: Category[];
  servicesByCategory: Record<CategoryId, Service[]>;
  advisorsByService: Record<string, Advisor[]>;
  daysShort: string[];
  times: string[];
  defaultTimezone: string;
}) {
  const { categories, servicesByCategory, advisorsByService, daysShort, times, defaultTimezone } =
    props;



  // estado del wizard     
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [state, setState] = useState<WizardState>({
    categoryId: undefined,
    serviceId: undefined,
    advisorId: undefined,
    slot: null,
    notes: "",
  });

  // derivados del estado 
  const services = useMemo<Service[]>(() => {
    return state.categoryId ? servicesByCategory[state.categoryId] ?? [] : [];
  }, [state.categoryId, servicesByCategory]);

  const advisors = useMemo<Advisor[]>(() => {
    return state.serviceId ? advisorsByService[state.serviceId] ?? [] : [];
  }, [state.serviceId, advisorsByService]);

  // determinista: marca no-disponibles para demo
  const isUnavailable = (dayIdx: number, timeIdx: number) => (dayIdx + timeIdx) % 4 === 0;

  // manejo de selección para step 1
  const selectCategory = (id: CategoryId) => {
    setState((s) => ({ ...s, categoryId: id, serviceId: undefined, advisorId: undefined }));
  };
  const selectService = (id: string) => {
    setState((s) => ({ ...s, serviceId: id, advisorId: undefined }));
  };
  const selectAdvisor = (id: string) => {
    setState((s) => ({ ...s, advisorId: id }));
  };

    // Helpers calendario mensual (para step 2)
  const weekIndexMon0 = (d: Date) => (d.getDay() + 6) % 7;
  const isSameDay = (a: Date | null, b: Date | null) =>
    !!a &&
    !!b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const monthLabelES = (d: Date) =>
    d.toLocaleDateString("es-ES", { month: "long", year: "numeric" });

  const buildMonthGrid = (month: Date) => {
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
  };

  const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  // Estado calendario mensual (para step 2)
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const monthCells = useMemo(() => buildMonthGrid(currentMonth), [currentMonth]);

  const goPrevMonth = () =>
    setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  const goNextMonth = () =>
    setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));

  // Helpers extra para pasado/fechas/horas 
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const today = startOfDay(new Date());
  // Verdadero si la fecha 'd' está en el pasado (antes de hoy)
  const isPastDate = (d: Date) => startOfDay(d) < today;
  // Verdadero si la hora HH:mm en 'onDate' ya pasó respecto a ahora 
  const isPastHour = (hhmm: string, onDate: Date) => {
    const [hh, mm] = hhmm.split(":").map(Number);
    const candidate = new Date(
      onDate.getFullYear(),
      onDate.getMonth(),
      onDate.getDate(),
      hh,
      mm,
      0,
      0
    );
    return candidate < new Date();
  };

  // selección de slot (step 2)
  const selectSlot = (dayIndex: number, start: string) => {
    const [h, m] = start.split(":").map(Number);
    const endH = h + 1;
    const end = `${String(endH).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

    // slot con info extra de fecha 
    const slot: SlotSelection & { date?: string } = {
      dayIndex,
      start,
      end,
      timezone: defaultTimezone, 
      date: selectedDate ? selectedDate.toISOString().slice(0, 10) : undefined,
    };
    setState((s) => ({ ...s, slot }));
  };

  // --- efectos UX calendario ---

  useEffect(() => {
    if (selectedDate && isPastDate(selectedDate)) {
      const sameMonthAsToday =
        currentMonth.getFullYear() === today.getFullYear() &&
        currentMonth.getMonth() === today.getMonth();
      setSelectedDate(sameMonthAsToday ? today : null);
    }
    setState((s) => ({ ...s, slot: null }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth]);

  // Al cambiar el día seleccionado, limpiar la hora
  useEffect(() => {
    setState((s) => ({ ...s, slot: null }));
  }, [selectedDate]);

  //  state de éxito (step 3)
  const [showSuccess, setShowSuccess] = useState(false);

  // control de navegación
  const canGoNext =
    (step === 1 && !!state.categoryId && !!state.serviceId && !!state.advisorId) ||
    (step === 2 && !!state.slot);

  const goNext = () => {
    if (step < 3 && canGoNext) setStep((s) => (s + 1) as 2 | 3);
  };
  const goPrev = () => step > 1 && setStep((s) => (s - 1) as 1 | 2);

  // bloque de progreso y pasos 
  const Progress = () => (
    <div className="flex items-center justify-center gap-3 border-b border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 px-6 py-5">
      {[1, 2, 3].map((n, i) => (
        <div key={n} className="flex items-center gap-3">
          <div
            className={classNames(
              "flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold",
              step === n && "bg-gradient-to-br from-blue-600 to-blue-700 text-white",
              step > n && "bg-emerald-500 text-white",
              step < n && "bg-slate-200 text-slate-600"
            )}
          >
            {n}
          </div>
          <span
            className={classNames(
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

  const Step1 = () => (
    <div className="space-y-10 p-6 md:p-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-neutral-900">Selecciona tu asesoría</h2>
        <p className="text-neutral-600">
          Elige la categoría, servicio y asesor que mejor se adapte a tus necesidades
        </p>
      </div>

      {/* Categorías */}
      <section>
        <h3 className="mb-4 border-b-2 border-slate-200 pb-2 text-lg font-semibold text-neutral-900">
          1. Categoría
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => selectCategory(c.id)}
              className={classNames(
                "rounded-2xl border-2 p-5 text-left transition",
                "hover:-translate-y-1 hover:shadow-md",
                state.categoryId === c.id
                  ? "border-blue-600 bg-blue-50/40"
                  : "border-slate-200 bg-white"
              )}
            >
              <div className="mb-2 text-3xl">{c.icon}</div>
              <h4 className="font-semibold text-neutral-900">{c.name}</h4>
              <p className="text-sm text-neutral-600">{c.description}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Servicios */}
      {state.categoryId && (
        <section>
          <h3 className="mb-4 border-b-2 border-slate-200 pb-2 text-lg font-semibold text-neutral-900">
            2. Servicio
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {services.map((s) => (
              <button
                key={s.id}
                onClick={() => selectService(s.id)}
                className={classNames(
                  "rounded-2xl border-2 p-5 text-left transition",
                  "hover:-translate-y-1 hover:shadow-md",
                  state.serviceId === s.id
                    ? "border-blue-600 bg-blue-50/40"
                    : "border-slate-200 bg-white"
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

      {/* Asesores */}
      {state.serviceId && (
        <section>
          <h3 className="mb-4 border-b-2 border-slate-200 pb-2 text-lg font-semibold text-neutral-900">
            3. Asesor
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {advisors.map((a) => (
              <button
                key={a.id}
                onClick={() => selectAdvisor(a.id)}
                className={classNames(
                  "rounded-2xl border-2 p-5 text-left transition",
                  "hover:-translate-y-1 hover:shadow-md",
                  state.advisorId === a.id
                    ? "border-blue-600 bg-blue-50/40"
                    : "border-slate-200 bg-white"
                )}
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-base font-bold text-white">
                    {a.name
                      .split(" ")
                      .map((p) => p[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-semibold text-neutral-900">{a.name}</h4>
                    <p className="text-sm text-neutral-600">{a.email}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {a.specialties.map((sp) => (
                    <span
                      key={sp}
                      className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-600"
                    >
                      {sp}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );

  const Step2 = () => {
    const isWeekendSelected = selectedDate ? weekIndexMon0(selectedDate) > 4 : false;

    const labelDiaSeleccionado = selectedDate
      ? selectedDate.toLocaleDateString("es-ES", {
          weekday: "long",
          day: "2-digit",
          month: "short",
        })
      : "—";

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
              <div key={w} className="p-3">{w}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 p-2 md:gap-2 md:p-3">
            {monthCells.map((cell, idx) => {
              if (!cell) {
                return <div key={`empty-${idx}`} className="h-10 rounded-lg bg-transparent md:h-12" />;
              }
              const isTodayCell =
                isSameDay(cell, new Date()) && cell.getMonth() === currentMonth.getMonth();
              const selected = isSameDay(cell, selectedDate);
              const weekend = weekIndexMon0(cell) > 4;
              const past = isPastDate(cell);

              return (
                <button
                  key={cell.toISOString()}
                  type="button"
                  onClick={() => !past && setSelectedDate(cell)}
                  disabled={past}
                  className={classNames(
                    "flex h-10 w-full items-center justify-center rounded-lg border text-[15px] font-bold text-neutral-800 transition md:h-12",
                    // pasado
                    past && "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400",
                    // fin de semana 
                    !past && !selected && weekend && "border-slate-100 bg-slate-50 text-neutral-600",
                    // día normal 
                    !past && !selected && !weekend && "border-slate-200 bg-white hover:border-blue-600",
                    // seleccionado: alto contraste 
                    selected && !past && "border-blue-500 bg-blue-100 text-blue-800 ring-1 ring-blue-300",
                    // hoy 
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
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {times.map((t, timeIdx) => {
                  const dayIdx = weekIndexMon0(selectedDate);
                  const unavailableByRule = dayIdx > 4 || isUnavailable(dayIdx, timeIdx);
                  const pastHourToday =
                    selectedDate && isSameDay(selectedDate, today) && isPastHour(t, selectedDate);
                  const unavailable = unavailableByRule || !!pastHourToday;

                  const selected = state.slot?.dayIndex === dayIdx && state.slot?.start === t;

                  return (
                    <button
                      key={t}
                      type="button"
                      disabled={unavailable}
                      onClick={() => selectSlot(dayIdx, t)}
                      className={classNames(
                        "rounded-lg border px-3 py-2 text-center text-[15px] font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-200",
                        unavailable &&
                          "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500",
                        !unavailable &&
                          !selected &&
                          "border-slate-300 bg-white text-neutral-900 hover:border-blue-600 hover:text-blue-700",
                        selected && "border-blue-600 bg-blue-600 text-white"
                      )}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const Step3 = () => {
    const categoryName = categories.find((c) => c.id === state.categoryId)?.name ?? "-";
    const service = services.find((s) => s.id === state.serviceId);
    const advisor = advisors.find((a) => a.id === state.advisorId);

    const dayName = state.slot
      ? ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"][state.slot.dayIndex]
      : "-";

    return (
      <div className="space-y-6 p-6 md:p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-neutral-900">Confirma tu asesoría</h2>
          <p className="text-neutral-600">Revisa los detalles antes de confirmar tu cita</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-6">
            <h3 className="mb-4 border-b-2 border-slate-200 pb-2 text-lg font-semibold text-neutral-900">
              Resumen de tu asesoría
            </h3>

            <dl className="divide-y divide-slate-200">
              <div className="flex items-center justify-between py-3">
                <dt className="text-sm font-medium text-neutral-700">Categoría</dt>
                <dd className="text-sm font-semibold text-neutral-900">{categoryName}</dd>
              </div>
              <div className="flex items-center justify-between py-3">
                <dt className="text-sm font-medium text-neutral-700">Servicio</dt>
                <dd className="text-sm font-semibold text-neutral-900">{service?.name ?? "-"}</dd>
              </div>
              <div className="flex items-center justify-between py-3">
                <dt className="text-sm font-medium text-neutral-700">Duración</dt>
                <dd className="text-sm font-semibold text-neutral-900">{service?.duration ?? "-"}</dd>
              </div>
              <div className="flex items-center justify-between py-3">
                <dt className="text-sm font-medium text-neutral-700">Asesor</dt>
                <dd className="text-sm font-semibold text-neutral-900">
                  {advisor ? `${advisor.name} (${advisor.email})` : "-"}
                </dd>
              </div>
              <div className="flex items-center justify-between py-3">
                <dt className="text-sm font-medium text-neutral-700">Fecha y hora</dt>
                <dd className="text-sm font-semibold text-neutral-900">
                  {state.slot
                    ? `${dayName}, ${state.slot.start} - ${state.slot.end} (${state.slot.timezone})`
                    : "-"}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border-2 border-slate-200 bg-white p-6">
            <label className="mb-2 block text-sm font-semibold text-neutral-700">
              Notas adicionales (opcional)
            </label>
            <textarea
              value={state.notes ?? ""}
              onChange={(e) => setState((s) => ({ ...s, notes: e.target.value }))}
              placeholder="Comparte información útil para tu asesor..."
              className="h-[140px] w-full rounded-xl border-2 border-slate-200 p-3 text-sm outline-none transition placeholder:text-neutral-400 focus:border-blue-600 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)]"
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-[900px] overflow-hidden rounded-2xl bg-white shadow-[0_10px_30px_rgba(0,0,0,0.08)] ring-1 ring-slate-100">
      <Progress />

      {step === 1 && <Step1 />}
      {step === 2 && <Step2 />}
      {step === 3 && <Step3 />}

      {/* Navegación */}
      <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5 md:flex-row">
        <button
          type="button"
          onClick={goPrev}
          disabled={step <= 1}
          className={classNames(
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
            onClick={goNext}
            disabled={!canGoNext}
            className={classNames(
              "inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 px-6 py-3 font-semibold text-white shadow-sm transition",
              "disabled:opacity-60"
            )}
          >
            Siguiente →
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowSuccess(true)}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 px-6 py-3 font-semibold text-white shadow-sm transition"
          >
            Confirmar Asesoría
          </button>
        )}
      </div>

      {/* Modal de éxito */}
      {showSuccess && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
            <div className="mb-2 text-5xl">✅</div>
            <h3 className="text-lg font-bold text-neutral-900">¡Asesoría confirmada!</h3>
            <p className="mt-1 text-sm text-neutral-600">
              Tu asesoría ha sido programada. Pronto recibirás un correo de confirmación.
            </p>
            <Link
              href="/dashboard"
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
    </div>
  );
}
