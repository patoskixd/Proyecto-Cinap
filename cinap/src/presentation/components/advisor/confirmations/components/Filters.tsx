"use client";

import { useMemo } from "react";
import type { PendingConfirmation } from "@domain/confirmations";

export type DateFilter = "" | "today" | "tomorrow" | "week" | "month";
export type Filters = {
  category: string;
  date: DateFilter;
  q: string;
};

export function useCategoryOptions(items: PendingConfirmation[]) {
  return useMemo(() => {
    const map = new Map<string, string>();
    for (const r of items) {
      const value = (r as any).category ?? (r as any).categoria ?? "";
      const label =
        (r as any).categoryLabel ??
        (r as any).categoriaLabel ??
        (r as any).categoria_nombre ??
        value;
      if (value) map.set(value, label || value);
    }
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [items]);
}

export default function Filters(props: {
  items: PendingConfirmation[];
  filters: Filters;
  onChange: (patch: Partial<Filters>) => void;
}) {
  const { items, filters, onChange } = props;
  const categoryOptions = useCategoryOptions(items);

  return (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        {/* Categoría */}
        <div className="flex min-w-[220px] flex-col">
          <label className="mb-1 text-sm font-semibold text-neutral-900">Categoría</label>
          <select
            className="rounded-lg border-2 border-slate-200 p-2.5 text-sm text-neutral-900 bg-white"
            value={filters.category}
            onChange={(e) => onChange({ category: e.target.value })}
          >
            <option value="">Todas las categorías</option>
            {categoryOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Fecha */}
        <div className="flex min-w-[220px] flex-col">
          <label className="mb-1 text-sm font-semibold text-neutral-900">Fecha</label>
          <select
            className="rounded-lg border-2 border-slate-200 p-2.5 text-sm text-neutral-900 bg-white"
            value={filters.date}
            onChange={(e) => onChange({ date: e.target.value as Filters["date"] })}
          >
            <option value="">Todas las fechas</option>
            <option value="today">Hoy</option>
            <option value="tomorrow">Mañana</option>
            <option value="week">Esta semana</option>
            <option value="month">Este mes</option>
          </select>
        </div>

        {/* Búsqueda */}
        <div className="relative flex-1">
          <input
            className="w-full rounded-lg border-2 border-slate-200 p-2.5 pl-9 text-sm text-neutral-900 bg-white placeholder:text-neutral-500"
            placeholder="Buscar por docente…"
            value={filters.q}
            onChange={(e) => onChange({ q: e.target.value })}
          />
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">⌕</span>
        </div>
      </div>
    </div>
  );
}
