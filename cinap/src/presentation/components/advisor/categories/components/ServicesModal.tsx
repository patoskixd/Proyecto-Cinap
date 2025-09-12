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
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-3">
      <div className="relative w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <h3 className="text-base font-semibold text-neutral-900">{title}</h3>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-md text-xl text-neutral-500 hover:bg-slate-100"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {services.map((s) => {
              const active = !!s.selected;
              const badgeClass = active
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-slate-100 text-slate-600 border-slate-200";
              const badgeText = active ? "Activo" : "No activo";

              return (
                <div
                  key={s.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="text-sm font-semibold text-neutral-900">{s.name}</div>
                    <span className={`whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-semibold ${badgeClass}`}>
                      {badgeText}
                    </span>
                  </div>

                  {s.description && (
                    <div className="mb-2 text-xs leading-relaxed text-neutral-600">
                      {s.description}
                    </div>
                  )}

                  {typeof s.duration !== "undefined" && (
                    <div className="mt-1 inline-block rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
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
  );
}
