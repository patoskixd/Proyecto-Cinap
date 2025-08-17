
import Link from "next/link";
// Componente que muestra acciones rápidas en el dashboard
// Incluye botones para agendar nueva asesoría ver todas las asesorías, acceder a reportes y configuración
// Se usa en la página del dashboard para facilitar el acceso a funciones comunes
export default function QuickActions() {
  return (
    <section className="pb-8">
      <h3 className="mb-4 text-xl font-semibold text-neutral-900">Acciones Rápidas</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
        <Link
          href="/asesorias/agendar"
          className="flex flex-col items-center gap-3 rounded-2xl border-2 border-slate-100 bg-white p-6 transition hover:-translate-y-1 hover:border-blue-600 hover:shadow-[0_10px_25px_rgba(37,99,235,0.15)]"
        >
          <span className="rounded-2xl bg-blue-50 p-4 text-3xl">➕</span>
          <span className="font-semibold text-neutral-900">Nueva Asesoría</span>
        </Link>
        <Link
          href="/asesorias"
          className="flex flex-col items-center gap-3 rounded-2xl border-2 border-slate-100 bg-white p-6 transition hover:-translate-y-1 hover:border-blue-600 hover:shadow-[0_10px_25px_rgba(37,99,235,0.15)]"
        >
          <span className="rounded-2xl bg-blue-50 p-4 text-3xl">📋</span>
          <span className="font-semibold text-neutral-900">Ver Todas</span>
        </Link>
        <button
          className="flex flex-col items-center gap-3 rounded-2xl border-2 border-slate-100 bg-white p-6 transition hover:-translate-y-1 hover:border-blue-600 hover:shadow-[0_10px_25px_rgba(37,99,235,0.15)]"
        >
          <span className="rounded-2xl bg-blue-50 p-4 text-3xl">📊</span>
          <span className="font-semibold text-neutral-900">Reportes</span>
        </button>
        <Link
          href="/perfil"
          className="flex flex-col items-center gap-3 rounded-2xl border-2 border-slate-100 bg-white p-6 transition hover:-translate-y-1 hover:border-blue-600 hover:shadow-[0_10px_25px_rgba(37,99,235,0.15)]"
        >
          <span className="rounded-2xl bg-blue-50 p-4 text-3xl">⚙️</span>
          <span className="font-semibold text-neutral-900">Configuración</span>
        </Link>
      </div>
    </section>
  );
}
