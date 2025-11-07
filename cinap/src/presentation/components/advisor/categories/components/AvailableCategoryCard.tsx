import React from "react";

type Svc = { id: string; name: string; description?: string; duration?: number; selected?: boolean };
type Cat = { id: string; name: string; description?: string; icon?: string };

export default function AvailableCategoryCard({
  category,
  services,
  maxChips = 2,
  onViewServices,
}: {
  category: Cat;
  services: Svc[];
  maxChips?: number;
  onViewServices: () => void;
}) {
  const uniq = dedup(services);
  const chips = uniq.slice(0, maxChips);
  const hidden = Math.max(uniq.length - maxChips, 0);

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-blue-200/40 bg-gradient-to-br from-white via-blue-50/30 to-yellow-50/20 shadow-lg backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:scale-105 hover:shadow-2xl hover:border-blue-300/60">
      {/* Decorative elements */}
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br from-blue-400/20 to-yellow-400/20 blur-xl transition-all duration-500 group-hover:scale-150 group-hover:bg-gradient-to-br group-hover:from-blue-500/30 group-hover:to-yellow-500/30" />
      
      {/* Status indicators */}
      <div className="absolute right-4 top-4 flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-gradient-to-r from-blue-400 to-blue-500 shadow-sm" />
      </div>

      {/* Main content */}
      <div className="relative p-6">
        {/* Category header */}
        <div className="mb-5">
          <h3 className="text-xl font-bold text-blue-900 transition-colors group-hover:text-blue-700 mb-3">{category.name}</h3>
          
          {/* Status badge */}
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 px-3 py-1 text-xs font-semibold text-gray-800 border border-gray-300/50">
            Disponible para Activar
          </div>
          
          <p className="text-sm text-blue-700/80 font-medium">{category.description}</p>
        </div>

        {/* Services preview */}
        <div className="mb-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-blue-800 uppercase tracking-wider">Servicios Disponibles</h4>
            <span className="rounded-full bg-blue-200 px-2 py-0.5 text-xs font-bold text-blue-800">{uniq.length}</span>
          </div>
          
          {uniq.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {chips.map((s) => (
                <span
                  key={`${category.id}-${s.id}`}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium border border-blue-300/70 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 transition-all duration-200 hover:scale-105 hover:bg-gradient-to-r hover:from-blue-100 hover:to-blue-200"
                >
                  {s.name}
                </span>
              ))}
              {hidden > 0 && (
                <span className="inline-flex items-center rounded-lg bg-gradient-to-r from-purple-100 to-purple-200 px-3 py-1.5 text-xs font-medium text-purple-700 border border-purple-300/70">
                  +{hidden} más
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action button */}
        <button
          onClick={onViewServices}
          className="w-full rounded-full bg-blue-100/80 backdrop-blur-sm border border-blue-200/50 px-4 py-3 font-semibold text-blue-700 shadow-md transition-all duration-300 hover:bg-blue-200/80 hover:shadow-lg hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="text-sm">Explorar Servicios</span>
          </div>
        </button>
      </div>
      
      {/* Shine effect */}
      <div className="absolute inset-0 -translate-x-full transform bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
    </div>
  );
}

function dedup<T extends { id: string; name?: string }>(arr: T[]): T[] {
  const seen = new Set<string>();
  return arr.filter((s) => {
    const key = `${s.id}::${s.name ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
