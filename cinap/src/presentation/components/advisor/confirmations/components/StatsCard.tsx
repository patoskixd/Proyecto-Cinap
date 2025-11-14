"use client";

type StatKey = "" | "today" | "week" | "month";

export function StatsCards(props: {
  counts: { total: number; today: number; week: number; month: number };
  active: StatKey;
  onPick: (k: StatKey) => void;
}) {
  const { counts, active, onPick } = props;

  const base =
    "cursor-pointer select-none rounded-2xl border border-blue-200 bg-gradient-to-br from-white via-blue-50/30 to-yellow-50/20 p-4 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-blue-300";
  const activeCls =
    "ring-2 ring-yellow-400 shadow-[0_10px_25px_rgba(251,191,36,0.25)] border-yellow-300 bg-gradient-to-br from-blue-50 via-yellow-50/50 to-blue-50/30";

  const stats = [
    { key: "", label: "Total pendientes", value: counts.total, tooltip: "Ver todas las solicitudes pendientes" },
    { key: "today", label: "Hoy", value: counts.today, tooltip: "Filtrar solicitudes de hoy" },
    { key: "week", label: "Esta semana", value: counts.week, tooltip: "Filtrar solicitudes de esta semana" },
    { key: "month", label: "Este mes", value: counts.month, tooltip: "Filtrar solicitudes de este mes" }
  ];

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <button
          key={stat.key}
          type="button"
          className={`${base} ${active === stat.key ? activeCls : ""}`}
          title={stat.tooltip}
          aria-pressed={active === stat.key}
          onClick={() => onPick(stat.key as StatKey)}
        >
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">{stat.value}</div>
            <div className="text-sm font-medium text-neutral-600">{stat.label}</div>
          </div>
        </button>
      ))}
    </div>
  );
}
