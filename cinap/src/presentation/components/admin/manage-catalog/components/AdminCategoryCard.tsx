import React from "react";

export default function AdminCategoryCard({
  cat, onEdit, onDelete, onActivate, onDeactivate, onViewServices, onAddService,
}:{
  cat: {
    id: string; name: string; description: string; icon: string;
    status: "active"|"inactive";
    services: { id: string; name: string; duration: string; status: "active"|"inactive"}[];
  };
  onEdit: () => void; onDelete: () => void; onActivate: () => void; onDeactivate: () => void;
  onViewServices: () => void; onAddService?: () => void;
}) {
  const serviceCount = cat.services.length;
  const activeServices = cat.services.filter(s => s.status === "active").length;
  const isActive = cat.status === "active";

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-blue-200/40 bg-gradient-to-br from-white via-blue-50/30 to-yellow-50/20 shadow-lg backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:scale-105 hover:shadow-2xl hover:border-blue-300/60">
      {/* Deco */}
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br from-blue-400/20 to-yellow-400/20 blur-xl transition-all duration-500 group-hover:scale-150 group-hover:bg-gradient-to-br group-hover:from-blue-500/30 group-hover:to-yellow-500/30" />

      {/* Main */}
      <div className="relative p-6">
        {/* Header (grid) */}
        <div className="mb-5">
          <div className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-2">
            {/* Título (máx 2 líneas) */}
            <h3
              className="col-start-1 row-start-1 max-w-full break-words text-xl font-bold leading-tight text-blue-900 transition-colors group-hover:text-blue-700 line-clamp-2 min-h-[2.5rem]"
              title={cat.name}
            >
              {cat.name}
            </h3>

            {/* Acciones (ocupan 2 filas a la derecha) */}
            <div className="col-start-2 row-span-2 self-start">
              <div className="flex flex-col items-end gap-2 whitespace-nowrap">
                {isActive ? (
                  <>
                    <button
                      type="button" title="Editar" aria-label="Editar" onClick={onEdit}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-100/80 px-3 py-1.5 text-sm font-medium text-blue-700 transition-all duration-200 hover:scale-105 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span>Editar</span>
                    </button>

                    <button
                      type="button" title="Desactivar" aria-label="Desactivar" onClick={onDeactivate}
                      className="inline-flex items-center gap-2 rounded-xl bg-red-100/80 px-3 py-1.5 text-sm font-medium text-red-700 transition-all duration-200 hover:scale-105 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-300"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Desactivar</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button" title="Activar" aria-label="Activar" onClick={onActivate}
                      className="inline-flex items-center gap-2 rounded-xl bg-green-100/80 px-3 py-1.5 text-sm font-medium text-green-700 transition-all duration-200 hover:scale-105 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-300"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Activar</span>
                    </button>

                    <button
                      type="button" title="Eliminar" aria-label="Eliminar" onClick={onDelete}
                      className="inline-flex items-center gap-2 rounded-xl bg-red-100/80 px-3 py-1.5 text-sm font-medium text-red-700 transition-all duration-200 hover:scale-105 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-300"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Eliminar</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Badge justo debajo del título */}
            <div
              className={`col-start-1 row-start-2 inline-flex items-center gap-1.5
                          w-fit justify-self-start rounded-full border px-2 py-0.5
                          text-xs font-semibold ${
                isActive
                  ? "border-green-200/50 bg-green-50/80 text-green-700"
                  : "border-gray-200/50 bg-gray-50/80 text-gray-700"
              }`}
            >
              {isActive ? "Activa" : "Inactiva"}
            </div>

          </div>

          {/* Descripción */}
          <p className="mt-2 text-sm font-medium text-blue-700/80">{cat.description}</p>
        </div>

        {/* Services info */}
        <div className="mb-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-blue-800">Servicios</h4>
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-blue-800">{activeServices} de {serviceCount}</span>
            </div>
          </div>

          {serviceCount > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {cat.services.slice(0, 3).map(s => (
                <span
                  key={s.id}
                  className={`rounded-lg border px-2 py-1 text-xs font-medium ${
                    s.status === "active"
                      ? "border-yellow-200/70 bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-800"
                      : "border-gray-200/70 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-600"
                  }`}
                >
                  {s.name}
                </span>
              ))}
              {serviceCount > 3 && (
                <span className="rounded-lg border border-blue-200/70 bg-gradient-to-r from-blue-50 to-blue-100 px-2 py-1 text-xs font-medium text-blue-600">
                  +{serviceCount - 3} más
                </span>
              )}
            </div>
          )}
        </div>

        {/* Bottom actions */}
        <div className={`grid ${isActive ? "grid-cols-2" : "grid-cols-1"} gap-3`}>
          <button
            onClick={onViewServices}
            className="group/btn relative overflow-hidden rounded-2xl bg-blue-100/80 backdrop-blur-sm border border-blue-200/50 px-4 py-3 font-semibold text-blue-700 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-200/80 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-300/50"
          >
            <span className="relative inline-flex items-center justify-center gap-2">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span className="text-sm">Ver servicios</span>
            </span>
          </button>

          {onAddService && isActive && (
            <button
              onClick={onAddService}
              className="group/btn relative overflow-hidden rounded-2xl bg-green-100/80 backdrop-blur-sm border border-green-200/50 px-4 py-3 font-semibold text-green-700 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-green-200/80 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-300/50"
            >
              <span className="relative inline-flex items-center justify-center gap-2">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="text-sm">Agregar</span>
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Shine */}
      <div className="absolute inset-0 -translate-x-full transform bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
    </div>
  );
}
