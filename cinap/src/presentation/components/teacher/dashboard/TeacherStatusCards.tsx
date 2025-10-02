type Props = {
  isCalendarConnected: boolean;
  monthCount: number;
  pendingCount: number;
};

export default function TeacherStatusCards({ isCalendarConnected, monthCount, pendingCount }: Props) {
  return (
    <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
      <CalendarCard connected={isCalendarConnected} />
      <MetricCard title="Este Mes" subtitle="Asesorías programadas" value={monthCount} icon="chart" />
      <MetricCard title="Pendientes" subtitle="Por confirmar" value={pendingCount} icon="clock" />
    </section>
  );
}

function CalendarCard({ connected }: { connected: boolean }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-lg ring-1 ring-blue-100 border border-blue-100">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-sm">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </span>
        <span
          className={[
            "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold shadow-sm",
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
      <h3 className="text-base font-semibold text-blue-900">Google Calendar</h3>
      <p className="text-sm text-blue-700">
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
  const getIcon = (iconType: string) => {
    if (title === "Este Mes") {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      );
    }
    if (title === "Pendientes") {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    // Ícono por defecto
    return (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    );
  };

  return (
    <div className="rounded-2xl bg-white p-5 shadow-lg ring-1 ring-blue-100 border border-blue-100">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-sm">
          {getIcon(icon)}
        </span>
        <span className="text-2xl font-extrabold text-blue-600">{value}</span>
      </div>
      <h3 className="text-base font-semibold text-blue-900">{title}</h3>
      <p className="text-sm text-blue-700">{subtitle}</p>
    </div>
  );
}
