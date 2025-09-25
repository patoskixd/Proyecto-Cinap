import React from "react";

export default function AdminCategoryCard({
  cat, onEdit, onDelete, onActivate, onDeactivate, onViewServices, onAddService,
}:{
  cat: { id: string; name: string; description: string; icon: string; status: "active"|"inactive";
         services: { id: string; name: string; duration: string; status: "active"|"inactive"}[] };
  onEdit: () => void; onDelete: () => void; onActivate: () => void; onDeactivate: () => void;
  onViewServices: () => void; onAddService?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <span className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${
          cat.status === "active" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"
        }`}>{cat.status === "active" ? "Activa" : "Inactiva"}</span>
        <div className="flex items-center gap-2">
          <button
            type="button" title="Editar" aria-label="Editar" onClick={onEdit}
            className="rounded-md p-2 text-base transition hover:scale-110 hover:bg-slate-100">✏️</button>

          {cat.status === "active" ? (
            <button
              type="button" title="Desactivar" aria-label="Desactivar" onClick={onDeactivate}
              className="rounded-md p-2 text-base transition hover:scale-110 hover:bg-slate-100">❌</button>
          ) : (
            <button
              type="button" title="Activar" aria-label="Activar" onClick={onActivate}
              className="rounded-md p-2 text-base transition hover:scale-110 hover:bg-slate-100">✅</button>
          )}

          <button
            type="button" title="Eliminar" aria-label="Eliminar" onClick={onDelete}
            className="rounded-md p-2 text-base transition hover:scale-110 hover:bg-slate-100">🗑️</button>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-neutral-900">{cat.name}</h3>
      <p className="mb-4 text-sm leading-relaxed text-neutral-600">{cat.description}</p>

      <div className="mb-5 flex flex-wrap gap-2">
        {cat.services.slice(0,2).map(s => (
          <span key={s.id} className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {s.name}
          </span>
        ))}
        {cat.services.length > 2 && (
          <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            +{cat.services.length - 2} más
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={onViewServices}
          className="rounded-full border-2 px-4 py-2 text-sm font-semibold border-slate-200 text-neutral-700 hover:border-blue-600 hover:text-blue-600">
          Ver servicios
        </button>
        {onAddService && (
          <button onClick={onAddService}
            className="rounded-full bg-gradient-to-br from-blue-600 to-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_15px_rgba(37,99,235,0.3)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(37,99,235,0.4)]">
            <span>➕</span> Agregar servicio
          </button>
        )}
      </div>
    </div>
  );
}
