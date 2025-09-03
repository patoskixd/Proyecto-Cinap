type Props = {
  isCalendarConnected: boolean;
  monthCount: number;
  pendingCount: number;
};

export default function TeacherStatusCards({ isCalendarConnected, monthCount, pendingCount }: Props) {
  return (
    <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
      <CalendarCard connected={isCalendarConnected} />
      <MetricCard title="Este Mes" subtitle="Asesorías programadas" value={monthCount} icon="📊" />
      <MetricCard title="Pendientes" subtitle="Por confirmar" value={pendingCount} icon="⏳" />
    </section>
  );
}

function CalendarCard({ connected }: { connected: boolean }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-lg text-white">
          📅
        </span>
        <span
          className={[
            "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
            connected
              ? "border-emerald-200 bg-emerald-50 text-emerald-600"
              : "border-rose-200 bg-rose-50 text-rose-600",
          ].join(" ")}
        >
          <span
            className={[
              "h-2 w-2 rounded-full",
              connected ? "bg-emerald-500" : "bg-rose-500",
            ].join(" ")}
          />
          {connected ? "Conectado" : "Desconectado"}
        </span>
      </div>
      <h3 className="text-base font-semibold text-slate-900">Google Calendar</h3>
      <p className="text-sm text-slate-600">
        {connected ? "Sincronización activa" : "Conecta tu calendario"}
      </p>
    </div>
  );
}

function MetricCard({
  title,
  subtitle,
  value,
  icon,
}: {
  title: string;
  subtitle: string;
  value: number | string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-lg text-white">
          {icon}
        </span>
        <span className="text-2xl font-extrabold text-blue-600">{value}</span>
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="text-sm text-slate-600">{subtitle}</p>
    </div>
  );
}
