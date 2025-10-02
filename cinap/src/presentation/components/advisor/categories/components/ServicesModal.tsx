import { useEffect } from "react";

type Svc = { id: string; name: string; description?: string; duration?: number; selected?: boolean };

export default function ServicesModal({
  title,
  services,
  onClose,
}: {
  title: string;
  services: Svc[];
  onClose: () => void;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 backdrop-blur-sm p-3"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-6xl bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden transform animate-in zoom-in-95 duration-200">
        {/* Header con gradiente */}
        <div className="h-16 bg-gradient-to-r from-blue-600 via-blue-700 to-yellow-500 relative">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="flex items-center justify-between px-6 py-4 relative z-10">
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-all duration-200"
              aria-label="Cerrar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="px-6 py-6">
          <div className="max-h-[75vh] overflow-y-auto">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {services.map((s) => {
                const active = !!s.selected;
                const badgeClass = active
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600";
                const badgeText = active ? "Activo" : "No activo";

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
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
