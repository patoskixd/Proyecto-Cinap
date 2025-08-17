
import Link from "next/link";
import type { Appointment } from "@/domain/appointment";
// Componente que muestra la lista de próximas asesorías
// Recibe un array de objetos Appointment como prop
// Cada objeto representa una asesoría con detalles como hora, título, estudiante y estado
// Se usa en la página del dashboard para mostrar las próximas asesorías programadas
export default function UpcomingList({ items }: { items: Appointment[] }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <h2 className="text-xl font-semibold text-neutral-900">Próximas Asesorías</h2>
        <Link href="/asesorias" className="font-semibold text-blue-600 hover:text-blue-700">
          Ver todas →
        </Link>
      </div>

      <div className="space-y-4 px-6 py-5">
        {items.map((a) => (
          <div
            key={a.id}
            className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-blue-500 hover:bg-slate-100"
          >
            <div className="flex min-w-[84px] flex-col items-center rounded-lg border-2 border-blue-600 bg-white px-3 py-2">
              <span className="text-base font-extrabold text-blue-600">{a.time}</span>
              <span className="text-xs font-medium text-neutral-500">{a.dateLabel}</span>
            </div>

            <div className="flex-1">
              <h4 className="text-base font-semibold text-neutral-900">{a.title}</h4>
              <p className="text-sm text-neutral-600">Estudiante: {a.student}</p>
              <div className="mt-2 flex gap-2">
                {a.status === "confirmada" && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Confirmada
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button className="h-10 w-10 rounded-lg bg-blue-50 text-lg transition hover:scale-105 hover:bg-blue-600 hover:text-white">
                📝
              </button>
              <button className="h-10 w-10 rounded-lg bg-blue-50 text-lg transition hover:scale-105 hover:bg-blue-600 hover:text-white">
                📞
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
