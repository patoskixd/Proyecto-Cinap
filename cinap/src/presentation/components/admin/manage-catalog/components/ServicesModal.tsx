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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-start">
          {services.map((s) => {
            const isActive = (s.active ?? s.selected) ?? false;
            const badgeClass = isActive
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-600";
            const badgeText = isActive ? "Activo" : "No activo";

            return (
              <div key={s.id} className="rounded-xl bg-white/90 backdrop-blur-sm p-5 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-200">
                {/* Título + estado derecha */}
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="text-sm font-semibold text-gray-900">{s.name}</div>
                  <span className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${badgeClass}`}>
                    {badgeText}
                  </span>
                </div>

                {s.description && (
                  <div className="mb-3 text-xs leading-relaxed text-gray-600">{s.description}</div>
                )}

                {typeof s.duration !== "undefined" && (
                  <div className="mb-4 inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-blue-50 to-yellow-50 px-3 py-1.5 text-xs font-medium text-blue-700">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {s.duration} min
                  </div>
                )}

                {/* Acciones */}
                <div className="flex items-center justify-start gap-2">
                  <button
                    type="button"
                    title="Editar"
                    aria-label="Editar"
                    onClick={() => onEdit?.(s)}
                    className="rounded-lg p-2.5 text-blue-600 hover:bg-blue-50 hover:scale-110 transition-all duration-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    title={isActive ? "Desactivar" : "Activar"}
                    aria-label={isActive ? "Desactivar" : "Activar"}
                    onClick={() => onToggleActive?.(s, !isActive)}
                    className={`rounded-lg p-2.5 transition-all duration-200 hover:scale-110 ${
                      isActive 
                        ? "text-red-600 hover:bg-red-50" 
                        : "text-green-600 hover:bg-green-50"
                    }`}
                  >
                    {isActive ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </button>

                  <button
                    type="button"
                    title="Eliminar"
                    aria-label="Eliminar"
                    onClick={() => onDelete?.(s)}
                    className="rounded-lg p-2.5 text-red-600 hover:bg-red-50 hover:scale-110 transition-all duration-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </BaseModal>
  );
}
