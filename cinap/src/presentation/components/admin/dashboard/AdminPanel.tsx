import Link from "next/link";

type Item = { href: string; title: string; description: string; icon: string };

const items: Item[] = [
  { href: "/admin/gestionar-docente",  title: "Ver Docentes",  description: "Lista completa de docentes",  icon: "👨‍🏫" },
  { href: "/admin/gestionar-asesor",  title: "Ver Asesores",  description: "Lista completa de asesores",  icon: "👩‍💼" },
  { href: "/admin/gestionar-catalogo", title: "Gestionar Catalogos", description: "Gestionar categorías y servicios de asesorías", icon: "🏷️" },
  { href: "/admin/gestionar-ubicaciones",  title: "Gestionar Ubicaciones",  description: "Administrar servicios disponibles", icon: "⚙️" }
];

export default function AdminPanel() {
  return (
    <aside className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
      <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-lg font-semibold text-slate-900">Panel de administración</h3>
        {/* badge en azul */}
        <span className="rounded-full bg-gradient-to-r from-blue-600 to-blue-700 px-2.5 py-0.5 text-xs font-semibold text-white">
          Admin
        </span>
      </div>

      <ul className="flex flex-col gap-3">
        {items.map((it) => (
          <li key={it.href}>
            <Link
              href={it.href}
              className="group flex w-full items-center gap-3 rounded-xl border-2 border-slate-200 bg-white p-4 transition
                         hover:translate-x-1 hover:border-blue-500 hover:bg-slate-50
                         hover:shadow-[0_8px_25px_rgba(37,99,235,0.15)]"
            >
              {/* icono con acento azul */}
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl
                               bg-gradient-to-r from-blue-600 to-blue-700 text-xl text-white">
                {it.icon}
              </span>

              <div className="flex-1">
                <h4 className="text-base font-semibold text-slate-900">{it.title}</h4>
                <p className="text-sm text-slate-600">{it.description}</p>
              </div>

              <span className="text-blue-600 transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
