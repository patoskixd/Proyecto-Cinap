import BaseModal from "./BaseModal";

type Svc = {
  id: string;
  name: string;
  description?: string;
  duration?: number;
  active?: boolean;
  selected?: boolean; // por compatibilidad
};

export default function ServicesModal({
  title,
  services,
  onClose,
  onEdit,
  onToggleActive,
  onDelete,
}: {
  title: string;
  services: Svc[];
  onClose: () => void;
  onEdit?: (svc: Svc) => void;
  onToggleActive?: (svc: Svc, nextActive: boolean) => void;
  onDelete?: (svc: Svc) => void;
}) {
  return (
    <BaseModal title={title} onClose={onClose} size="lg">
      <div className="max-h-[75vh] overflow-y-auto">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {services.map((s) => {
            const isActive = (s.active ?? s.selected) ?? false;
            const badgeClass = isActive
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-slate-100 text-slate-600 border-slate-200";
            const badgeText = isActive ? "Activo" : "No activo";

            return (
              <div key={s.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                {/* Título + estado derecha */}
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="text-sm font-semibold text-neutral-900">{s.name}</div>
                  <span className={`whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-semibold ${badgeClass}`}>
                    {badgeText}
                  </span>
                </div>

                {s.description && (
                  <div className="mb-2 text-xs leading-relaxed text-neutral-600">{s.description}</div>
                )}

                {typeof s.duration !== "undefined" && (
                  <div className="mt-1 inline-block rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                    {s.duration} min
                  </div>
                )}

                {/* Acciones */}
                <div className="mt-3 flex items-center justify-start gap-1.5">
                  <button
                    type="button"
                    title="Editar"
                    aria-label="Editar"
                    onClick={() => onEdit?.(s)}
                    className="rounded-md p-2 text-base transition hover:scale-110 hover:bg-slate-100"
                  >✏️</button>

                  <button
                    type="button"
                    title={isActive ? "Desactivar" : "Activar"}
                    aria-label={isActive ? "Desactivar" : "Activar"}
                    onClick={() => onToggleActive?.(s, !isActive)}
                    className="rounded-md p-2 text-base transition hover:scale-110 hover:bg-slate-100"
                  >{isActive ? "❌" : "✅"}</button>

                  <button
                    type="button"
                    title="Eliminar"
                    aria-label="Eliminar"
                    onClick={() => onDelete?.(s)}
                    className="rounded-md p-2 text-base transition hover:scale-110 hover:bg-slate-100"
                  >🗑️</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </BaseModal>
  );
}
