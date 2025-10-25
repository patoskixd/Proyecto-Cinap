"use client";
import React from "react";

type Option = { id: string; name: string };

type Props = {
  query: string;
  onQueryChange: (v: string) => void;
  categoryId: string;
  onCategoryChange: (id: string) => void;
  serviceId: string;
  onServiceChange: (id: string) => void;
  categories: Option[];
  services: Option[];
  total: number;
  onReset?: () => void;
};

export default function ManageAdvisorsHeader({
  query,
  onQueryChange,
  categoryId,
  onCategoryChange,
  serviceId,
  onServiceChange,
  categories,
  services,
  total,
  onReset,
}: Props) {
  const hasFilters = Boolean(query.trim()) || Boolean(categoryId) || Boolean(serviceId);

  return (
    <div className="mb-6 rounded-3xl border border-blue-200/50 bg-gradient-to-br from-white via-blue-50/40 to-yellow-50/30 p-6 shadow-xl backdrop-blur-md md:mb-8 md:p-8">
      <div className="mb-6 flex flex-col gap-3 text-center md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-blue-900">Gestión de Asesores</h1>
          <p className="mt-1 text-blue-700">Administra y organiza tu equipo de asesores</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm ring-1 ring-blue-200/60">
          <span className="h-2 w-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 shadow" />
          <span>{total} Asesores Totales </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="flex flex-col gap-1">
          <label className="pl-2 text-xs font-semibold uppercase tracking-wide text-blue-800/80">Buscar</label>
          <div className="group relative w-full">
            <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-blue-500/70">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Buscar asesores por nombre o correo electrónico..."
              className="w-full rounded-2xl border border-blue-100/70 bg-white/90 pl-12 pr-12 py-3 text-sm font-medium text-blue-900 placeholder-blue-400 outline-none transition-all duration-300 shadow-sm focus:border-blue-400 focus:ring-4 focus:ring-blue-100/80"
            />
            {query && (
              <button
                onClick={() => onQueryChange("")}
                className="absolute inset-y-0 right-3 flex items-center justify-center rounded-full p-2 text-blue-400 transition hover:text-blue-600"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="pl-2 text-xs font-semibold uppercase tracking-wide text-blue-800/80">Categoría</label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-blue-500/70">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 3c-3.53 0-6.5 2.5-6.5 5.5 0 1.78.98 3.37 2.53 4.46l-1.03 2.41a.5.5 0 00.61.67l3.26-.91c.69.11 1.4.17 2.13.17 3.53 0 6.5-2.5 6.5-5.5S13.53 3 10 3z" />
              </svg>
            </div>
            <select
              value={categoryId}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="w-full rounded-2xl border border-blue-100/70 bg-white/90 py-3 pl-9 pr-4 text-sm font-medium text-blue-900 outline-none transition-all duration-300 shadow-sm focus:border-blue-400 focus:ring-4 focus:ring-blue-100/80"
            >
              <option value="">Todas las categorías</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="pl-2 text-xs font-semibold uppercase tracking-wide text-blue-800/80">Servicio</label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-blue-500/70">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 3a2 2 0 00-2 2v1c0 .265.105.52.293.707L7 11.414V15h2v2h2v-2h2v-3.586l4.707-4.707A1 1 0 0018 6V5a2 2 0 00-2-2H4z" />
              </svg>
            </div>
            <select
              value={serviceId}
              onChange={(e) => onServiceChange(e.target.value)}
              disabled={!categoryId}
              className="w-full rounded-2xl border border-blue-100/70 bg-white/90 py-3 pl-9 pr-4 text-sm font-medium text-blue-900 outline-none transition-all duration-300 shadow-sm focus:border-blue-400 focus:ring-4 focus:ring-blue-100/80 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">Todos los servicios</option>
              {services.map((svc) => (
                <option key={svc.id} value={svc.id}>
                  {svc.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {onReset && hasFilters && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={onReset}
            className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-4 py-2 text-xs font-semibold text-blue-700 shadow-sm transition hover:border-blue-300 hover:bg-white"
          >
            <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 5a1 1 0 011 1v2.586l1.293-1.293a1 1 0 111.414 1.414L11.414 10l2.293 2.293a1 1 0 11-1.414 1.414L11 12.414V15a1 1 0 11-2 0v-2.586l-1.293 1.293a1 1 0 11-1.414-1.414L8.586 10 6.293 7.707a1 1 0 111.414-1.414L9 8.586V6a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  );
}
