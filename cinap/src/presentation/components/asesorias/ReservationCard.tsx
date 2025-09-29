import type { Reservation } from "@/domain/reservation";

export default function ReservationCard({ r }: { r: Reservation }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-br from-white via-blue-50/20 to-yellow-50/10 shadow-lg backdrop-blur-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="flex items-center justify-between border-b border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 p-3 text-white shadow-lg">
            <span className="text-xl font-extrabold leading-none">{r.day}</span>
            <span className="text-[10px] font-bold opacity-90 tracking-wider">{r.month}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-blue-900">{r.time}</span>
            <span className="text-xs text-blue-700">{r.duration}</span>
          </div>
        </div>

        <div
          className={[
            "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold shadow-sm",
            r.status === "confirmada" && "border-emerald-200 bg-emerald-50 text-emerald-700",
            r.status === "pendiente" && "border-amber-200 bg-amber-50 text-amber-700",
            r.status === "cancelada" && "border-red-200 bg-red-50 text-red-700",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {r.status === "confirmada" && (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Confirmada
            </>
          )}
          {r.status === "pendiente" && (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Pendiente
            </>
          )}
          {r.status === "cancelada" && (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancelada
            </>
          )}
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-lg font-semibold text-blue-900">{r.serviceTitle}</h3>

        <div className="mt-4 flex items-center gap-4 rounded-xl bg-white/60 backdrop-blur-sm border border-blue-100 p-4 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 via-blue-700 to-yellow-500 text-base font-bold text-white shadow-lg ring-2 ring-white">
            {r.advisor.initials}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-blue-900">{r.advisor.name}</span>
            <span className="text-xs text-blue-600">{r.advisor.email}</span>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button className="flex flex-1 min-w-[120px] items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Ver detalle
          </button>
          <button className="flex flex-1 min-w-[120px] items-center justify-center gap-2 rounded-lg bg-white/80 backdrop-blur-sm border border-blue-200 px-4 py-2.5 text-sm font-semibold text-blue-700 transition-all hover:bg-white hover:border-blue-300">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Reprogramar
          </button>
          <button className="flex flex-1 min-w-[120px] items-center justify-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition-all hover:bg-red-100 hover:border-red-300">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
