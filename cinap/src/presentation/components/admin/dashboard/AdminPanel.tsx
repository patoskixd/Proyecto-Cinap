import Link from "next/link";

type Item = { href: string; title: string; description: string; iconType: string };

const items: Item[] = [
  { href: "/admin/gestionar-docente",  title: "Ver Docentes",  description: "Lista completa de docentes",  iconType: "teacher" },
  { href: "/admin/gestionar-asesor",  title: "Ver Asesores",  description: "Lista completa de asesores",  iconType: "advisor" },
  { href: "/admin/gestionar-catalogo", title: "Gestionar Catalogos", description: "Gestionar categorías y servicios de asesorías", iconType: "catalog" },
  { href: "/admin/gestionar-ubicaciones",  title: "Gestionar Ubicaciones",  description: "Administrar servicios disponibles", iconType: "location" },
  { href: "/admin/gestionar-documentos", title: "Gestión de Documentos", description: "Sube o elimina documentos de la base semántica", iconType: "documents" }
];

const getIcon = (iconType: string) => {
  switch (iconType) {
    case "teacher":
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      );
    case "advisor":
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      );
    case "catalog":
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      );
    case "location":
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    case "documents":
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 20h9M12 4h9M4 8h16M4 16h16" />
        </svg>
      );
    default:
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
        </svg>
      );
  }
};

export default function AdminPanel() {
  return (
    <aside className="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-blue-100">
      <div className="flex items-center justify-between border-b border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4">
        <h3 className="text-xl font-semibold text-blue-900">Panel de administración</h3>
        {/* badge en azul */}
        <span className="rounded-full bg-gradient-to-br from-blue-600 to-blue-700 px-2.5 py-0.5 text-sm font-semibold text-white shadow-sm">
          Admin
        </span>
      </div>

      <div className="space-y-3 px-6 py-5">
        {items.map((it) => (
          <div key={it.href}>
            <Link
              href={it.href}
              className="group flex w-full items-center gap-3 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-white p-4 transition hover:border-blue-400 hover:shadow-md hover:-translate-y-0.5"
            >
              {/* icono con acento azul */}
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
