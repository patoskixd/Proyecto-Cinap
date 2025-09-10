"use client";

import { Filters } from "../hooks/useMySlots";
import { todayLocalISO } from "../utils/time";

type Props = {
  value: Filters;
  onChange: (updater: (prev: Filters) => Filters) => void;
  options: {
    categories: string[];
    services: string[];
    campuses: string[];
  };
};

export default function FiltersBar({ value, onChange, options }: Props) {
  return (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {/* Categoría */}
        <div>
          <label className="mb-1 block text-sm font-semibold text-neutral-800">Categoría</label>
          <select
            className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-neutral-900"
            value={value.category}
            onChange={(e) => onChange(prev => ({ ...prev, category: e.target.value }))}
          >
            <option value="">Todas</option>
            {options.categories.map(c => (
              <option key={c} value={c.toLowerCase()}>{c}</option>
            ))}
          </select>
        </div>

        {/* Servicio */}
        <div>
          <label className="mb-1 block text-sm font-semibold text-neutral-800">Servicio</label>
          <select
            className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-neutral-900"
            value={value.service}
            onChange={(e) => onChange(prev => ({ ...prev, service: e.target.value }))}
          >
            <option value="">Todos</option>
            {options.services.map(s => (
              <option key={s} value={s.toLowerCase()}>{s}</option>
            ))}
          </select>
        </div>

        {/* Campus */}
        <div>
          <label className="mb-1 block text-sm font-semibold text-neutral-800">Campus</label>
          <select
            className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-neutral-900"
            value={value.campus}
            onChange={(e) => onChange(prev => ({ ...prev, campus: e.target.value }))}
          >
            <option value="">Todos</option>
            {options.campuses.map(c => (
              <option key={c} value={c.toLowerCase()}>{c}</option>
            ))}
          </select>
        </div>

        {/* Estado */}
        <div>
          <label className="mb-1 block text-sm font-semibold text-neutral-800">Estado</label>
          <select
            className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-neutral-900"
            value={value.status}
            onChange={(e) => onChange(prev => ({ ...prev, status: e.target.value as Filters["status"] }))}
          >
            <option value="">Todos</option>
            <option value="disponible">Disponible</option>
            <option value="ocupado">Ocupado</option>
            <option value="cancelado">Cancelado</option>
            <option value="expirado">Expirado</option>
          </select>
        </div>

        {/* Fecha */}
        <div>
          <label className="mb-1 block text-sm font-semibold text-neutral-800">Fecha</label>
          <input
            type="date"
            min={todayLocalISO()}
            className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-neutral-900"
            value={value.date}
            onChange={(e) => onChange(prev => ({ ...prev, date: e.target.value }))}
          />
        </div>
      </div>
    </div>
  );
}
