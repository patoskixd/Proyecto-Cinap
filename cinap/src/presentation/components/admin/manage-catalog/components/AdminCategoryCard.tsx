import React from "react";

export default function AdminCategoryCard({
  cat, onEdit, onDelete, onActivate, onDeactivate, onViewServices, onAddService,
}:{
  cat: { id: string; name: string; description: string; icon: string; status: "active"|"inactive";
         services: { id: string; name: string; duration: string; status: "active"|"inactive"}[] };
  onEdit: () => void; onDelete: () => void; onActivate: () => void; onDeactivate: () => void;
  onViewServices: () => void; onAddService?: () => void;
}) {
  const serviceCount = cat.services.length;
  const activeServices = cat.services.filter(s => s.status === "active").length;
  
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-blue-200/40 bg-gradient-to-br from-white via-blue-50/30 to-yellow-50/20 shadow-lg backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:scale-105 hover:shadow-2xl hover:border-blue-300/60">
      {/* Decorative elements */}
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br from-blue-400/20 to-yellow-400/20 blur-xl transition-all duration-500 group-hover:scale-150 group-hover:bg-gradient-to-br group-hover:from-blue-500/30 group-hover:to-yellow-500/30" />
      
      {/* Status indicators */}
      <div className="absolute right-4 top-4 flex items-center gap-2">
        {cat.status === "active" && <div className="h-3 w-3 rounded-full bg-gradient-to-r from-green-400 to-green-500 shadow-lg animate-pulse" />}
      </div>

      {/* Main content */}
      <div className="relative p-6">
        {/* Category header */}
        <div className="mb-5">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-xl font-bold text-blue-900 transition-colors group-hover:text-blue-700">{cat.name}</h3>
            
            {/* Quick action buttons */}
            <div className="flex items-center gap-1 ml-2">
              <button
                type="button" title="Editar" aria-label="Editar" onClick={onEdit}
                className="group/btn flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100/80 text-blue-600 transition-all duration-200 hover:bg-blue-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-300">
                <svg className="h-4 w-4 transition-transform duration-200 group-hover/btn:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>

              {cat.status === "active" ? (
                <button
                  type="button" title="Desactivar" aria-label="Desactivar" onClick={onDeactivate}
                  className="group/btn flex h-8 w-8 items-center justify-center rounded-xl bg-red-100/80 text-red-600 transition-all duration-200 hover:bg-red-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-red-300">
                  <svg className="h-4 w-4 transition-transform duration-200 group-hover/btn:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              ) : (
                <button
                  type="button" title="Activar" aria-label="Activar" onClick={onActivate}
                  className="group/btn flex h-8 w-8 items-center justify-center rounded-xl bg-green-100/80 text-green-600 transition-all duration-200 hover:bg-green-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-green-300">
                  <svg className="h-4 w-4 transition-transform duration-200 group-hover/btn:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              )}

              <button
                type="button" title="Eliminar" aria-label="Eliminar" onClick={onDelete}
                className="group/btn flex h-8 w-8 items-center justify-center rounded-xl bg-red-100/80 text-red-600 transition-all duration-200 hover:bg-red-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-red-300">
                <svg className="h-4 w-4 transition-transform duration-200 group-hover/btn:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Status badge */}
          <div className={`mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${
            cat.status === "active" 
              ? "border-green-200/50 bg-gradient-to-r from-green-100 to-green-200 text-green-800" 
              : "border-gray-200/50 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800"
          }`}>
            {cat.status === "active" ? "Activa" : "Inactiva"}
          </div>
          
          <p className="text-sm text-blue-700/80 font-medium">{cat.description}</p>
        </div>

        {/* Services info */}
        <div className="mb-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-blue-800 uppercase tracking-wider">Servicios</h4>
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-blue-800">{activeServices} de {serviceCount}</span>
            </div>
          </div>
          
          {serviceCount > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {cat.services.slice(0, 3).map(s => (
                <span key={s.id} className={`rounded-lg px-2 py-1 text-xs font-medium border ${
                  s.status === "active"
                    ? "border-yellow-200/70 bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-800"
                    : "border-gray-200/70 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-600"
                }`}>
                  {s.name}
                </span>
              ))}
              {serviceCount > 3 && (
                <span className="rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 px-2 py-1 text-xs font-medium text-blue-600 border border-blue-200/70">
                  +{serviceCount - 3} más
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={onViewServices}
            className="group/btn relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 px-4 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-700 via-blue-800 to-blue-900 opacity-0 transition-opacity duration-300 group-hover/btn:opacity-100" />
            <div className="relative flex items-center justify-center gap-2">
              <svg className="h-4 w-4 transition-transform duration-300 group-hover/btn:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span className="text-sm">Ver servicios</span>
            </div>
          </button>
          
          {onAddService && (
            <button 
              onClick={onAddService}
              className="group/btn relative overflow-hidden rounded-2xl bg-gradient-to-r from-yellow-500 via-yellow-600 to-yellow-700 px-4 py-3 font-semibold text-blue-900 shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-yellow-300"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-600 via-yellow-700 to-yellow-800 opacity-0 transition-opacity duration-300 group-hover/btn:opacity-100" />
              <div className="relative flex items-center justify-center gap-2">
                <svg className="h-4 w-4 transition-transform duration-300 group-hover/btn:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="text-sm">Agregar</span>
              </div>
            </button>
          )}
        </div>
      </div>
      
      {/* Shine effect */}
      <div className="absolute inset-0 -translate-x-full transform bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
    </div>
  );
}
