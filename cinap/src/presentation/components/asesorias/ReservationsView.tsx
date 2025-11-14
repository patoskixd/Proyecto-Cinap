"use client";

import { useEffect, useId, useState } from "react";

import type { Role } from "@/domain/auth";
import type { Reservation } from "@/domain/reservation";
import ReservationCard from "./ReservationCard";
import CancelReservationModal from "./CancelReservationModal";
import type { ReservationsFilters, ReservationsState } from "./hooks/useReservations";
import { notify } from "../shared/Toast/ToastProvider";

interface Props {
  role: Role | null;
  state: ReservationsState;
}

const STATUS_OPTIONS = [
  { value: "", label: "Todos los estados" },
  { value: "confirmada", label: "Confirmadas" },
  { value: "pendiente", label: "Pendientes" },
  { value: "cancelada", label: "Canceladas" },
  { value: "completada", label: "Completadas" },
];

export default function ReservationsView({ role, state }: Props) {
  const {
    tab,
    setPage,
    page,
    pages,
    filters,
    setFilters,
    items,
    loading,
    error,
    capabilities,
    cancelReservation,
    confirmReservation,
    actionState,
  } = state;

  const [cancelTarget, setCancelTarget] = useState<Reservation | null>(null);
  const [selectOptions, setSelectOptions] = useState<{ categories: string[]; services: string[] }>({
    categories: [],
    services: [],
  });

  const categoryFieldId = useId();
  const serviceFieldId = useId();
  const dateFromFieldId = useId();
  const statusFieldId = useId();

  useEffect(() => {
    setSelectOptions((prev) => {
      const categories = new Set(prev.categories);
      const services = new Set(prev.services);

      for (const item of items) {
        const categoryLabel = item.categoryLabel ?? item.category;
        if (categoryLabel) categories.add(categoryLabel);

        const serviceLabel = item.serviceTitle ?? item.service;
        if (serviceLabel) services.add(serviceLabel);
      }

      return {
        categories: Array.from(categories).sort((a, b) => a.localeCompare(b, "es")),
        services: Array.from(services).sort((a, b) => a.localeCompare(b, "es")),
      };
    });
  }, [items]);

  useEffect(() => {
    setSelectOptions({ categories: [], services: [] });
  }, [tab]);

  const hasPrev = page > 1;
  const hasNext = page < pages;
  const prevPage = () => setPage((p) => Math.max(1, p - 1));
  const nextPage = () => setPage((p) => Math.min(pages, p + 1));

  const updateFilter = (updater: (prev: ReservationsFilters) => ReservationsFilters) => {
    setFilters(updater);
  };

  const requestCancel = (reservation: Reservation) => {
    setCancelTarget(reservation);
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    try {
      await cancelReservation(cancelTarget.id);
      notify("Asesoria cancelada", "info");
      setCancelTarget(null);
    } catch (e: any) {
      notify(e?.message ?? "No se pudo cancelar la asesoria", "error");
    }
  };

  const handleConfirm = async (id: string) => {
    try {
      await confirmReservation(id);
      notify("Asesoria confirmada", "success");
    } catch (e: any) {
      notify(e?.message ?? "No se pudo confirmar la asesoria", "error");
    }
  };

  const isCancellingCurrent =
    !!(cancelTarget && actionState.type === "cancel" && actionState.id === cancelTarget.id);

  const showPagination = !loading && pages > 1;

  const skeletonCards = Array.from({ length: 6 });

  return (
    <div className="space-y-6">
      <div className="mb-6 rounded-2xl border border-blue-200 bg-gradient-to-br from-white via-blue-50/30 to-blue-50/20 p-6 shadow-lg backdrop-blur-sm">
        <div className="mb-4">
          <h2 className="mb-1 text-lg font-semibold text-blue-900">Filtros de busqueda</h2>
          <p className="text-sm text-blue-700">
            Ajusta los filtros para encontrar asesorias especificas por categoria, servicio o estado.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-blue-900" htmlFor={categoryFieldId}>
              Categoria
            </label>
            <select
              id={categoryFieldId}
              value={filters.category}
              onChange={(e) => updateFilter((prev) => ({ ...prev, category: e.target.value }))}
              className="w-full rounded-lg border-2 border-blue-200 bg-white/80 p-2.5 text-sm text-blue-900 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
            >
              <option value="">Todas</option>
              {selectOptions.categories.map((label) => (
                <option key={label} value={label}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-blue-900" htmlFor={serviceFieldId}>
              Servicio
            </label>
            <select
              id={serviceFieldId}
              value={filters.service}
              onChange={(e) => updateFilter((prev) => ({ ...prev, service: e.target.value }))}
              className="w-full rounded-lg border-2 border-blue-200 bg-white/80 p-2.5 text-sm text-blue-900 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
            >
              <option value="">Todos</option>
              {selectOptions.services.map((label) => (
                <option key={label} value={label}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-blue-900" htmlFor={dateFromFieldId}>
              Fecha desde
            </label>
            <input
              id={dateFromFieldId}
              type="date"
              value={filters.dateFrom}
              onChange={(e) => {
                updateFilter((prev) => ({ ...prev, dateFrom: e.target.value }));
              }}
              className="w-full rounded-lg border-2 border-blue-200 bg-white/80 p-2.5 text-sm text-blue-900 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
              placeholder="Selecciona una fecha"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-blue-900" htmlFor={statusFieldId}>
              Estado
            </label>
            <select
              id={statusFieldId}
              value={filters.status}
              onChange={(e) => updateFilter((prev) => ({ ...prev, status: e.target.value }))}
              className="w-full rounded-lg border-2 border-blue-200 bg-white/80 p-2.5 text-sm text-blue-900 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value || "all"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error ? (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-6 py-4 text-sm text-rose-700 shadow-sm">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <span className="text-sm font-semibold text-blue-700">Cargando asesorias...</span>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {skeletonCards.map((_, idx) => (
              <div
                key={`reservation-skeleton-${idx}`}
                className="flex animate-pulse flex-col gap-4 rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50/60 to-white p-4 shadow-sm"
              >
                <div className="h-14 rounded-lg bg-blue-100/80" />
                <div className="space-y-2">
                  <div className="h-4 w-3/4 rounded bg-blue-100" />
                  <div className="h-3 w-2/3 rounded bg-blue-100/80" />
                  <div className="h-3 w-1/2 rounded bg-blue-100/60" />
                </div>
                <div className="mt-auto h-6 w-24 rounded-full bg-blue-100/80 self-start" />
              </div>
            ))}
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <h2 className="mb-1 text-lg font-semibold text-neutral-900">No hay asesorias para mostrar</h2>
          <p className="text-neutral-600">Ajusta los filtros o cambia de pestana para explorar otras fechas.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 items-start">
            {items.map((r) => (
              <ReservationCard
                key={r.id}
                reservation={r}
                role={role}
                canCancel={capabilities.canCancel}
                canConfirm={capabilities.canConfirm}
                onCancel={() => requestCancel(r)}
                onConfirm={() => handleConfirm(r.id)}
                actionState={actionState}
              />
            ))}
          </div>

          {showPagination ? (
            <div className="mt-6 flex flex-col items-center justify-between gap-3 sm:flex-row">
              <div className="text-sm text-neutral-600">
                Pagina <span className="font-semibold">{page}</span> de <span className="font-semibold">{pages}</span>
              </div>
              <div className="inline-flex overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm text-black">
                <button
                  onClick={prevPage}
                  disabled={!hasPrev}
                  className="px-4 py-2 text-sm font-semibold text-black hover:bg-slate-50 disabled:opacity-50 disabled:text-black/40"
                >
                  Anterior
                </button>
                <div className="px-4 py-2 text-sm font-semibold bg-slate-50 border-x border-slate-200">{page}</div>
                <button
                  onClick={nextPage}
                  disabled={!hasNext}
                  className="px-4 py-2 text-sm font-semibold text-black hover:bg-slate-50 disabled:opacity-50 disabled:text-black/40"
                >
                  Siguiente
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}
      {cancelTarget ? (
        <CancelReservationModal
          reservation={cancelTarget}
          onKeep={() => setCancelTarget(null)}
          onConfirmCancel={handleCancel}
          loading={isCancellingCurrent}
        />
      ) : null}
    </div>
  );
}
