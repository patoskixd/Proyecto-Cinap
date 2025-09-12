import React from "react";

type Svc = { id: string; name: string; description?: string; duration?: number; selected?: boolean };
type Cat = { id: string; name: string; description?: string; icon?: string };

export default function ActiveCategoryCard({
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
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-3xl">{category.icon ?? "🎓"}</div>
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-700">
          Activa
        </span>
      </div>

      <h3 className="text-lg font-semibold text-neutral-900">{category.name}</h3>
      <p className="mb-4 text-sm leading-relaxed text-neutral-600">{category.description}</p>

      <div className="mb-5 flex flex-wrap gap-2">
        {chips.map((s) => (
          <span
            key={`${category.id}-${s.id}`}
            className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
          >
            {s.name}
          </span>
        ))}
        {hidden > 0 && (
          <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            +{hidden} más
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={onViewServices}
          className="rounded-full border-2 border-slate-200 px-4 py-2 text-sm font-semibold text-neutral-700 hover:border-blue-600 hover:text-blue-600"
        >
          Ver servicios
        </button>
      </div>
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
