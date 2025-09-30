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
    <div className="mb-6 rounded-2xl border border-blue-200 bg-gradient-to-br from-white via-blue-50/30 to-yellow-50/20 p-6 shadow-lg backdrop-blur-sm">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-blue-900 mb-1">Filtros de búsqueda</h3>
        <p className="text-sm text-blue-700">Utiliza los filtros para encontrar los cupos que necesitas</p>
      </div>
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Categoría */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-blue-900">Categoría</label>
          <select
            className="w-full rounded-lg border-2 border-blue-200 bg-white/80 backdrop-blur-sm p-2.5 text-sm text-blue-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200"
            value={value.category}
            onChange={(e) => onChange(prev => ({ ...prev, category: e.target.value }))}
          >
            <option value="">Todas las categorías</option>
            {options.categories.map(c => (
              <option key={c} value={c.toLowerCase()}>{c}</option>
            ))}
          </select>
        </div>

        {/* Servicio */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-blue-900">Servicio</label>
          <select
            className="w-full rounded-lg border-2 border-blue-200 bg-white/80 backdrop-blur-sm p-2.5 text-sm text-blue-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200"
            value={value.service}
            onChange={(e) => onChange(prev => ({ ...prev, service: e.target.value }))}
          >
            <option value="">Todos los servicios</option>
            {options.services.map(s => (
              <option key={s} value={s.toLowerCase()}>{s}</option>
            ))}
          </select>
        </div>

        {/* Campus */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-blue-900">Campus</label>
          <select
            className="w-full rounded-lg border-2 border-blue-200 bg-white/80 backdrop-blur-sm p-2.5 text-sm text-blue-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200"
            value={value.campus}
            onChange={(e) => onChange(prev => ({ ...prev, campus: e.target.value }))}
          >
            <option value="">Todos los campus</option>
            {options.campuses.map(c => (
              <option key={c} value={c.toLowerCase()}>{c}</option>
            ))}
          </select>
        </div>

        {/* Estado */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-blue-900">Estado</label>
          <select
            className="w-full rounded-lg border-2 border-blue-200 bg-white/80 backdrop-blur-sm p-2.5 text-sm text-blue-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200"
            value={value.status}
            onChange={(e) => onChange(prev => ({ ...prev, status: e.target.value as Filters["status"] }))}
          >
            <option value="">Todos los estados</option>
            <option value="disponible">Disponible</option>
            <option value="ocupado">Ocupado</option>
            <option value="cancelado">Cancelado</option>
            <option value="expirado">Expirado</option>
          </select>
        </div>

        {/* Fecha */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-blue-900">Fecha</label>
          <input
            type="date"
            min={todayLocalISO()}
            className="w-full rounded-lg border-2 border-blue-200 bg-white/80 backdrop-blur-sm p-2.5 text-sm text-blue-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200"
            value={value.date}
            onChange={(e) => onChange(prev => ({ ...prev, date: e.target.value }))}
          />
        </div>
      </div>
    </div>
  );
}
