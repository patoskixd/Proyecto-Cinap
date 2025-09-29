"use client";

import { useMemo, useState } from "react";
import type { Reservation } from "@/domain/reservation";
import ReservationCard from "./ReservationCard";

type Filters = {
  category: string;
  service: string;
  advisor: string;
  status: string;
  dateFrom: string;
};

const initialFilters: Filters = {
  category: "",
  service: "",
  advisor: "",
  status: "",
  dateFrom: "",
};

export default function ReservationsView({
  upcoming,
  past,
}: {
  upcoming: Reservation[];
  past: Reservation[];
}) {
  const [activeTab, setActiveTab] = useState<"proximas" | "pasadas">("proximas");
  const [filters, setFilters] = useState<Filters>(initialFilters);

  const onClear = () => setFilters(initialFilters);

  const applyFilters = (items: Reservation[]) => {
    return items.filter((r) => {
      if (filters.category && r.category !== filters.category) return false;
      if (filters.service && r.service !== filters.service) return false;
      if (filters.advisor && !r.advisor.name.toLowerCase().includes(filters.advisor.toLowerCase()))
        return false;
      if (filters.status && r.status !== filters.status) return false;
      if (filters.dateFrom && r.dateISO) {
        const from = new Date(filters.dateFrom);
        const date = new Date(r.dateISO);
        if (date < from) return false;
      }
      return true;
    });
  };

  const filteredUpcoming = useMemo(() => applyFilters(upcoming), [upcoming, filters]);
  const filteredPast = useMemo(() => applyFilters(past), [past, filters]);

  const upcomingCount = filteredUpcoming.length;
  const pastCount = filteredPast.length;

  return (
    <div>
      {/* Tabs */}
      <div className="mb-6">
        <div className="inline-flex w-full overflow-x-auto rounded-xl border border-blue-200 bg-gradient-to-br from-white via-blue-50/30 to-yellow-50/20 p-1 shadow-lg backdrop-blur-sm sm:w-auto">
          <button
            onClick={() => setActiveTab("proximas")}
            className={[
              "inline-flex items-center gap-3 rounded-lg px-6 py-3 text-sm font-semibold transition-all",
              activeTab === "proximas"
                ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg"
                : "text-blue-700 hover:bg-white/50",
            ].join(" ")}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Próximas
            <span
              className={[
                "rounded-full px-2.5 py-0.5 text-xs font-bold",
                activeTab === "proximas" ? "bg-white/20 text-white" : "bg-blue-200 text-blue-800",
              ].join(" ")}
            >
              {upcomingCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("pasadas")}
            className={[
              "ml-1 inline-flex items-center gap-3 rounded-lg px-6 py-3 text-sm font-semibold transition-all",
              activeTab === "pasadas"
                ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg"
                : "text-blue-700 hover:bg-white/50",
            ].join(" ")}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Pasadas
            <span
              className={[
                "rounded-full px-2.5 py-0.5 text-xs font-bold",
                activeTab === "pasadas" ? "bg-white/20 text-white" : "bg-blue-200 text-blue-800",
              ].join(" ")}
            >
              {pastCount}
            </span>
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-6 rounded-2xl border border-blue-200 bg-gradient-to-br from-white via-blue-50/30 to-yellow-50/20 p-6 shadow-lg backdrop-blur-sm">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-1">Filtros de búsqueda</h3>
          <p className="text-sm text-blue-700">Utiliza los filtros para encontrar las asesorías que necesitas</p>
        </div>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-blue-900">Categoría</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
              className="w-full rounded-lg border-2 border-blue-200 bg-white/80 backdrop-blur-sm p-2.5 text-sm text-blue-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200"
            >
              <option value="">Todas las categorías</option>
              <option value="academica">Académica</option>
              <option value="psicologica">Psicológica</option>
              <option value="vocacional">Vocacional</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-blue-900">Servicio</label>
            <select
              value={filters.service}
              onChange={(e) => setFilters((f) => ({ ...f, service: e.target.value }))}
              className="w-full rounded-lg border-2 border-blue-200 bg-white/80 backdrop-blur-sm p-2.5 text-sm text-blue-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200"
            >
              <option value="">Todos los servicios</option>
              <option value="tutoria">Tutoría Individual</option>
              <option value="orientacion">Orientación Vocacional</option>
              <option value="apoyo">Apoyo Psicológico</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-blue-900">Asesor</label>
            <input
              value={filters.advisor}
              onChange={(e) => setFilters((f) => ({ ...f, advisor: e.target.value }))}
              placeholder="Nombre del asesor"
              className="w-full rounded-lg border-2 border-blue-200 bg-white/80 backdrop-blur-sm p-2.5 text-sm text-blue-900 placeholder:text-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-blue-900">Fecha desde</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
              className="w-full rounded-lg border-2 border-blue-200 bg-white/80 backdrop-blur-sm p-2.5 text-sm text-blue-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-blue-900">Estado</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
              className="w-full rounded-lg border-2 border-blue-200 bg-white/80 backdrop-blur-sm p-2.5 text-sm text-blue-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200"
            >
              <option value="">Todos los estados</option>
              <option value="confirmada">Confirmada</option>
              <option value="pendiente">Pendiente</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClear}
            className="inline-flex items-center gap-2 rounded-lg bg-white/80 backdrop-blur-sm px-6 py-2.5 text-sm font-semibold text-blue-700 border border-blue-200 transition-all hover:bg-white hover:border-blue-300"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Limpiar filtros
          </button>
        </div>
      </div>

      {/* Contenido */}
      {activeTab === "proximas" ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredUpcoming.map((r) => (
            <ReservationCard key={r.id} r={r} />
          ))}
          {filteredUpcoming.length === 0 && (
            <div className="col-span-full rounded-2xl border border-blue-200 bg-gradient-to-br from-white via-blue-50/30 to-yellow-50/20 p-10 text-center shadow-lg backdrop-blur-sm">
              <div className="mx-auto max-w-xl">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                  <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-blue-900">Sin resultados</h3>
                <p className="mt-1 text-blue-700">Prueba cambiando los filtros de búsqueda.</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-white via-blue-50/30 to-yellow-50/20 p-10 text-center shadow-lg backdrop-blur-sm">
          <div className="mx-auto max-w-lg">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-blue-900">No tienes asesorías pasadas</h3>
            <p className="mt-1 text-blue-700">
              Cuando completes tus primeras asesorías, aparecerán aquí para que puedas revisarlas.
            </p>
            <a
              href="/asesorias/agendar"
              className="mt-6 inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-blue-600 via-blue-700 to-yellow-500 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl hover:scale-105"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Programar Primera Asesoría
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
