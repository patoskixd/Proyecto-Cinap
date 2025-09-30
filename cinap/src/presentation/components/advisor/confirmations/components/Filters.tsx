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
    <div className="mb-6 rounded-2xl border border-blue-200 bg-gradient-to-br from-white via-blue-50/30 to-yellow-50/20 p-6 shadow-lg backdrop-blur-sm">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-blue-900 mb-1">Filtros de búsqueda</h3>
        <p className="text-sm text-blue-700">Encuentra rápidamente las confirmaciones que necesitas revisar</p>
      </div>
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Categoría */}
        <div className="flex flex-col">
          <label className="mb-2 block text-sm font-semibold text-blue-900">Categoría</label>
          <select
            className="w-full rounded-lg border-2 border-blue-200 bg-white/80 backdrop-blur-sm p-2.5 text-sm text-blue-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200"
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
        <div className="flex flex-col">
          <label className="mb-2 block text-sm font-semibold text-blue-900">Fecha</label>
          <select
            className="w-full rounded-lg border-2 border-blue-200 bg-white/80 backdrop-blur-sm p-2.5 text-sm text-blue-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200"
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
        <div className="flex flex-col">
          <label className="mb-2 block text-sm font-semibold text-blue-900">Buscar docente</label>
          <div className="relative">
            <input
              className="w-full rounded-lg border-2 border-blue-200 bg-white/80 backdrop-blur-sm p-2.5 pl-10 text-sm text-blue-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 placeholder:text-blue-500"
              placeholder="Nombre del docente..."
              value={filters.q}
              onChange={(e) => onChange({ q: e.target.value })}
            />
            <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
