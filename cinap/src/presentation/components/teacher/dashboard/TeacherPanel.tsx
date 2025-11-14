"use client";

import { useTeacherPendingConfirmations } from "./hooks/useTeacherPendingConfirmations";

export default function TeacherPanel() {
  const { data, loading, error } = useTeacherPendingConfirmations();
  const items = data ?? [];

  // Orden + agrupado por día
  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-blue-100">
        <div className="flex items-center justify-between border-b border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4">
          <h2 className="text-xl font-semibold text-blue-900">Pendientes</h2>
          <span className="rounded-full bg-gradient-to-br from-blue-600 to-blue-700 px-2.5 py-0.5 text-sm font-semibold text-white shadow-sm">
            {loading ? "…" : items.length}
          </span>
        </div>

        {error && (
          <div className="px-6 py-4 text-sm text-red-700 bg-red-50 border-b border-red-200">
            {error}
          </div>
        )}

        {/* Content area */}
        <div className="px-6 py-6" aria-live="polite">
          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
                <p className="text-sm font-medium text-blue-700">Cargando pendientes…</p>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!loading && items.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-blue-200 bg-blue-50 px-6 py-12">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="mt-4 text-lg font-semibold text-blue-900">¡Todo al día!</p>
              <p className="mt-2 text-center text-sm text-blue-700 leading-relaxed">
                No tienes asesorías pendientes de confirmación.
              </p>
            </div>
          )}

          {!loading && items.length > 0 && (
            <ul className="space-y-4">
              {items.map((p) => {
                const dt = p.inicioISO ? new Date(p.inicioISO) : null
                const fecha = p.fecha ?? (dt ? dt.toLocaleDateString("es-CL", { dateStyle: "medium" }) : "")
                const hora = p.hora ?? (dt ? dt.toLocaleTimeString("es-CL", { timeStyle: "short" }) : "")

                return (
                  <li
                    key={p.id}
                    className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md"
                  >
                    {/* Header con badge de categoría */}
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                        {p.categoria}
                      </span>
                    </div>

                    {/* Título del servicio */}
                    <h3 className="mb-4 text-base font-bold text-blue-900 leading-snug">{p.servicio}</h3>

                    {/* Información con iconos SVG simples */}
                    <div className="space-y-3">
                      {/* Fecha y hora */}
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50">
                          <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <div className="flex-1 pt-0.5">
                          <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Fecha y hora</p>
                          <p className="mt-0.5 text-sm font-semibold text-gray-900">
                            {fecha}
                            {hora ? ` — ${hora}` : ""}
                          </p>
                        </div>
                      </div>

                      {/* Ubicación */}
                      {p.ubicacion && (
                        <div className="flex items-start gap-3">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50">
                            <svg
                              className="h-4 w-4 text-blue-600"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                          </div>
                          <div className="flex-1 pt-0.5">
                            <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Ubicación</p>
                            <p className="mt-0.5 text-sm font-semibold text-gray-900">{p.ubicacion}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer notice */}
                    <div className="mt-4 rounded-lg bg-orange-50 px-3 py-2.5 border border-orange-200">
                      <p className="text-xs font-medium text-orange-800">
                        Pendiente de confirmación. Puedes confirmar tu solicitud desde el correo electrónico o directamente en el apartado “Ver tus asesorías” dentro de la plataforma.
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
