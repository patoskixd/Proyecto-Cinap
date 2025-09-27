
import type { Draft } from "@/domain/appointment";
// Componente que muestra la lista de borradores de asesorías
// Recibe un array de objetos Draft como prop
// Cada objeto representa un borrador con detalles como título, estado y fecha de creación
export default function DraftsList({ items }: { items: Draft[] }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <h2 className="text-xl font-semibold text-neutral-900"> Pendientes</h2>
        <span className="rounded-full bg-blue-600 px-2.5 py-0.5 text-sm font-semibold text-white">
          {items.length}
        </span>
      </div>

      <div className="space-y-3 px-6 py-5">
        {items.map((d) => (
          <div
            key={d.id}
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-500 hover:bg-slate-100"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-xl">
              {d.icon}
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-neutral-900">{d.title}</h4>
              <p className="text-sm text-neutral-600">{d.status}</p>
              <span className="text-xs text-neutral-400">{d.dateLabel}</span>
            </div>
            <div className="flex gap-2">
              <button className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-blue-700">
                Completar
              </button>
              <button className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-semibold text-neutral-600 transition hover:border-blue-600 hover:text-blue-600">
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
