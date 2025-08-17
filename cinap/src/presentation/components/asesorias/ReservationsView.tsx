// src/presentation/components/asesorias/ReservationsView.tsx
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
      <div className="mb-4">
        <div className="inline-flex w-full overflow-x-auto rounded-xl bg-white p-1 shadow-sm ring-1 ring-slate-100 sm:w-auto">
          <button
            onClick={() => setActiveTab("proximas")}
            className={[
              "inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition",
              activeTab === "proximas"
                ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow"
                : "text-neutral-600 hover:bg-slate-50",
            ].join(" ")}
          >
            <span>📅</span> Próximas
            <span
              className={[
                "ml-2 rounded-full px-2 py-0.5 text-xs font-bold",
                activeTab === "proximas" ? "bg-white/20 text-white" : "bg-slate-200 text-neutral-600",
              ].join(" ")}
            >
              {upcomingCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("pasadas")}
            className={[
              "ml-1 inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition",
              activeTab === "pasadas"
                ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow"
                : "text-neutral-600 hover:bg-slate-50",
            ].join(" ")}
          >
            <span>📋</span> Pasadas
            <span
              className={[
                "ml-2 rounded-full px-2 py-0.5 text-xs font-bold",
                activeTab === "pasadas" ? "bg-white/20 text-white" : "bg-slate-200 text-neutral-600",
              ].join(" ")}
            >
              {pastCount}
            </span>
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-neutral-700">Categoría</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
              className="rounded-xl border-2 border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-600 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)]"
            >
              <option value="">Todas</option>
              <option value="academica">Académica</option>
              <option value="psicologica">Psicológica</option>
              <option value="vocacional">Vocacional</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-neutral-700">Servicio</label>
            <select
              value={filters.service}
              onChange={(e) => setFilters((f) => ({ ...f, service: e.target.value }))}
              className="rounded-xl border-2 border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-600 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)]"
            >
              <option value="">Todos</option>
              <option value="tutoria">Tutoría Individual</option>
              <option value="orientacion">Orientación Vocacional</option>
              <option value="apoyo">Apoyo Psicológico</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-neutral-700">Asesor</label>
            <input
              value={filters.advisor}
              onChange={(e) => setFilters((f) => ({ ...f, advisor: e.target.value }))}
              placeholder="Nombre del asesor"
              className="rounded-xl border-2 border-slate-200 px-3 py-2 text-sm placeholder:text-neutral-400 outline-none transition focus:border-blue-600 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-neutral-700">Rango de fechas</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
              className="rounded-xl border-2 border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-600 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-neutral-700">Estado</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
              className="rounded-xl border-2 border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-600 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)]"
            >
              <option value="">Todos</option>
              <option value="confirmada">Confirmada</option>
              <option value="pendiente">Pendiente</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={() => {/* ya se aplican automáticamente */}}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5"
            >
              🔍 Filtrar
            </button>
            <button
              onClick={onClear}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-slate-200"
            >
              🗑️ Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Contenido */}
      {activeTab === "proximas" ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredUpcoming.map((r) => (
            <ReservationCard key={r.id} r={r} />
          ))}
          {filteredUpcoming.length === 0 && (
            <div className="col-span-full rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-100">
              <div className="mx-auto max-w-xl">
                <div className="mb-4 text-5xl opacity-60">🔎</div>
                <h3 className="text-xl font-semibold text-neutral-900">Sin resultados</h3>
                <p className="mt-1 text-neutral-600">Prueba cambiando los filtros.</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-100">
          <div className="mx-auto max-w-lg">
            <div className="mb-4 text-5xl opacity-60">📚</div>
            <h3 className="text-xl font-semibold text-neutral-900">No tienes asesorías pasadas</h3>
            <p className="mt-1 text-neutral-600">
              Cuando completes tus primeras asesorías, aparecerán aquí para que puedas revisarlas.
            </p>
            <a
              href="/asesoria/agendar"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 px-6 py-3 font-semibold text-white shadow-[0_8px_25px_rgba(37,99,235,0.3)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_35px_rgba(37,99,235,0.4)]"
            >
              ➕ Programar Primera Asesoría
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
