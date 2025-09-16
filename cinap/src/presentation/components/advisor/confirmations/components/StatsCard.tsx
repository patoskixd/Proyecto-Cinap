"use client";

type StatKey = "" | "today" | "week" | "month";

export function StatsCards(props: {
  counts: { total: number; today: number; week: number; month: number };
  active: StatKey;
  onPick: (k: StatKey) => void;
}) {
  const { counts, active, onPick } = props;

  const base =
    "cursor-pointer select-none rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow";
  const activeCls =
    "ring-2 ring-blue-500 shadow-[0_10px_25px_rgba(37,99,235,0.15)]";

  return (
    <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div
        role="button"
        className={`${base} ${active === "" ? activeCls : ""}`}
        title="Quitar filtro de fecha"
        onClick={() => onPick("")}
      >
        <div className="text-xl font-bold text-blue-600">{counts.total}</div>
        <div className="text-sm font-medium text-neutral-600">Pendientes</div>
      </div>

      <div
        role="button"
        className={`${base} ${active === "today" ? activeCls : ""}`}
        title="Filtrar a Hoy"
        onClick={() => onPick("today")}
      >
        <div className="text-xl font-bold text-blue-600">{counts.today}</div>
        <div className="text-sm font-medium text-neutral-600">Hoy</div>
      </div>

      <div
        role="button"
        className={`${base} ${active === "week" ? activeCls : ""}`}
        title="Filtrar a Esta semana"
        onClick={() => onPick("week")}
      >
        <div className="text-xl font-bold text-blue-600">{counts.week}</div>
        <div className="text-sm font-medium text-neutral-600">Esta semana</div>
      </div>

      <div
        role="button"
        className={`${base} ${active === "month" ? activeCls : ""}`}
        title="Filtrar a Este mes"
        onClick={() => onPick("month")}
      >
        <div className="text-xl font-bold text-blue-600">{counts.month}</div>
        <div className="text-sm font-medium text-neutral-600">Este mes</div>
      </div>
    </div>
  );
}
