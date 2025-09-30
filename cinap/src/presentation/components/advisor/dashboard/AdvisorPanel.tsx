import Link from "next/link";

type Stats = {
  slotsSelected?: number;   
  pending?: number;         
  cancelled?: number;       
};

export default function AdvisorPanel({ stats }: { stats?: Stats }) {
  const items = [
    {
      href: "/asesorias/mis-cupos",
      title: "Mis Cupos",
      description:
        typeof stats?.slotsSelected === "number"
          ? `${stats.slotsSelected} cupos seleccionados`
          : "Abrir o editar cupos disponibles",
      iconType: "slots",
    },
    {
      href: "/asesorias/pendientes",
      title: "Por Confirmar",
      description:
        typeof stats?.pending === "number"
          ? `${stats.pending} asesorías pendientes`
          : "Confirmaciones pendientes",
      iconType: "pending",
    },
    {
      href: "/asesorias/gestionar-categorias",
      title: "Ver Categorías y servicios",
      description: "Categorías y servicios disponibles",
      iconType: "categories",
    },
  ];

  const getIcon = (iconType: string) => {
    switch (iconType) {
      case "slots":
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case "pending":
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "categories":
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
    }
  };

  return (
    <aside className="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-blue-100">
      <div className="flex items-center justify-between border-b border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4">
        <h3 className="text-xl font-semibold text-blue-900">Panel de Asesor</h3>
        <span className="rounded-full bg-gradient-to-br from-blue-600 to-blue-700 px-2.5 py-0.5 text-sm font-semibold text-white shadow-sm">
          Asesor
        </span>
      </div>

      <div className="space-y-3 px-6 py-5">
        {items.map((it) => (
          <div key={it.href}>
            <Link
              href={it.href}
              className="group flex w-full items-center gap-3 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-white p-4 transition hover:border-blue-400 hover:shadow-md hover:-translate-y-0.5"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-sm">
                {getIcon(it.iconType)}
              </span>

              <div className="flex-1">
                <h4 className="text-sm font-semibold text-blue-900">{it.title}</h4>
                <p className="text-sm text-blue-700">{it.description}</p>
              </div>

              <span className="text-blue-600 transition-transform group-hover:translate-x-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </Link>
          </div>
        ))}
      </div>
    </aside>
  );
}
