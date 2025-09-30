
import type { Draft } from "@/domain/appointment";
// Componente que muestra la lista de borradores de asesorías
// Recibe un array de objetos Draft como prop
// Cada objeto representa un borrador con detalles como título, estado y fecha de creación
export default function DraftsList({ items }: { items: Draft[] }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-blue-100">
      <div className="flex items-center justify-between border-b border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4">
        <h2 className="text-xl font-semibold text-blue-900">Pendientes</h2>
        <span className="rounded-full bg-gradient-to-br from-blue-600 to-blue-700 px-2.5 py-0.5 text-sm font-semibold text-white shadow-sm">
          {items.length}
        </span>
      </div>

      <div className="space-y-3 px-6 py-5">
        {items.map((d) => (
          <div
            key={d.id}
            className="flex items-center gap-3 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-white p-4 transition hover:border-blue-400 hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-sm">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-blue-900">{d.title}</h4>
              <p className="text-sm text-blue-700">{d.status}</p>
              <span className="text-xs text-blue-500">{d.dateLabel}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
