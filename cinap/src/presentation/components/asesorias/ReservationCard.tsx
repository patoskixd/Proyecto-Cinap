import type { Reservation } from "@/domain/reservation";

export default function ReservationCard({ r }: { r: Reservation }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-br from-slate-50 to-slate-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center rounded-xl bg-white p-2 shadow">
            <span className="text-xl font-extrabold text-blue-600 leading-none">{r.day}</span>
            <span className="text-[10px] font-bold text-neutral-500 tracking-wider">{r.month}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-neutral-900">{r.time}</span>
            <span className="text-xs text-neutral-500">{r.duration}</span>
          </div>
        </div>

        <div
          className={[
            "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold",
            r.status === "confirmada" && "border-emerald-200 bg-emerald-50 text-emerald-600",
            r.status === "pendiente" && "border-amber-200 bg-amber-50 text-amber-600",
            r.status === "cancelada" && "border-red-200 bg-red-50 text-red-600",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {r.status === "confirmada" && <>✅ Confirmada</>}
          {r.status === "pendiente" && <>⏳ Pendiente</>}
          {r.status === "cancelada" && <>❌ Cancelada</>}
        </div>
      </div>

      <div className="p-5">
        <h3 className="text-lg font-semibold text-neutral-900">{r.serviceTitle}</h3>

        <div className="mt-4 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-base font-bold text-white">
            {r.advisor.initials}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-neutral-900">{r.advisor.name}</span>
            <span className="text-xs text-neutral-600">{r.advisor.email}</span>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button className="flex flex-1 min-w-[120px] items-center justify-center gap-2 rounded-md bg-gradient-to-br from-blue-600 to-blue-700 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5">
            👁️ Ver detalle
          </button>
          <button className="flex flex-1 min-w-[120px] items-center justify-center gap-2 rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-slate-200">
            📅 Reprogramar
          </button>
          <button className="flex flex-1 min-w-[120px] items-center justify-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100">
            ❌ Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
