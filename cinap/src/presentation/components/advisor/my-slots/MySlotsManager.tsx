"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import type { MySlot } from "@/domain/advisor/mySlots";
import { useMySlots } from "./hooks/useMySlots";
import FiltersBar from "./components/Filters";
import Stats from "./components/Stats";
import SlotCard from "./components/SlotCard";
import EditModal from "./components/EditModal";
import ConfirmModal from "./components/ConfirmModal";

import ToastProvider, {notify} from "../../shared/Toast/ToastProvider";
import LoadingStateCard from "@/presentation/components/shared/LoadingStateCard";

export default function MySlotsManager() {
  const {
    slots, loading, filtered, stats, filters, setFilters,
    updateSlot, deleteSlot, reactivateSlot, disableSlot, selectOptions,
    page, pages, setPage,
  } = useMySlots();

  const [editing, setEditing] = useState<MySlot | null>(null);
  const [confirmPatch, setConfirmPatch] = useState<MySlot | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<MySlot | null>(null);


  const startEdit = (id: string) => {
    const s = slots.find(x => x.id === id);
    if (s) setEditing({ ...s });
  };

  const openDelete = (id: string) => {
    const s = slots.find(x => x.id === id);
    if (!s) return;

    if (s.status !== "cancelado" && s.status !== "expirado") {
      notify("Para eliminar, primero desactiva el cupo.", "info");
      return;
    }
    setConfirmDelete(s);
  };

  const confirmDeleteYes = async () => {
    if (!confirmDelete) return;
    try {
      await deleteSlot(confirmDelete.id);
      setConfirmDelete(null);
      notify("Cupo eliminado", "error");
    } catch (e: any) {
      notify(e?.message || "No se puede eliminar un cupo reservado", "error");
    }
  };

  const onEditConfirm = (patch: MySlot) => setConfirmPatch(patch);

  const confirmSaveYes = async () => {
    if (!confirmPatch) return;
    try {
      await updateSlot(confirmPatch.id, confirmPatch);
      setConfirmPatch(null);
      setEditing(null);
      notify("Cambios confirmados y guardados", "success");
    } catch (e: any) {
      notify(e?.message || "No se pudo guardar", "error");
    }
  };

  // helpers de paginación
  const hasPrev = page > 1;
  const hasNext = page < pages;
  const prevPage = () => setPage(p => Math.max(1, p - 1));
  const nextPage = () => setPage(p => Math.min(pages, p + 1));

  // mostramos paginación solo si hay más de 1 página
  const showPagination = useMemo(() => !loading && pages > 1, [loading, pages]);

  return (
    <div className="py-6 space-y-6">
      {/* encabezado*/}
      <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-white via-blue-50/30 to-yellow-50/20 p-6 shadow-lg backdrop-blur-sm md:p-8">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-bold text-blue-900">Mis cupos</h1>
            <p className="mt-1 text-blue-700">
              Configura los cupos que estarán disponibles para los estudiantes.
            </p>
          </div>
          <Link
            href="/asesor/crear-cupos"
            className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-blue-600 via-blue-700 to-yellow-500 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl hover:scale-105"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Crear cupos
          </Link>
        </div>
      </div>

      {/* filtros */}
      <FiltersBar value={filters} onChange={setFilters} options={selectOptions} />

      {/* stats */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[1,2,3].map(i => (
            <div key={i} className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
              <div className="text-center">
                <div className="h-8 w-20 mx-auto mb-2 bg-slate-200 rounded animate-pulse" />
                <div className="h-4 w-28 mx-auto bg-slate-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Stats total={stats.total} disponibles={stats.disponibles} ocupadasHM={stats.ocupadasHM} />
      )}

      {/* grid de cards paginadas */}
      {loading ? (
        <LoadingStateCard
          title="Cargando cupos..."
          subtitle="Obteniendo la información más reciente de tus cupos"
        />
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <h3 className="mb-1 text-lg font-semibold text-neutral-900">No hay cupos</h3>
          <p className="mb-4 text-neutral-600">Crea tu primer cupo para comenzar</p>
          <Link href="/asesor/crear-cupos" className="rounded-full bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700">
            Crear cupo
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 items-start">
            {filtered.map(s => (
              <SlotCard
                key={s.id}
                slot={s}
                onEdit={startEdit}
                onDelete={openDelete}
                onReactivate={async (id) => { await reactivateSlot(id); }}
                onDisable={async (id) => { await disableSlot(id); }}
                notify={notify}
              />
            ))}
          </div>

          {/* paginación */}
          {showPagination && (
            <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
              <div className="text-sm text-neutral-600">
                Página <span className="font-semibold">{page}</span> de <span className="font-semibold">{pages}</span>
                <span className="ml-3 hidden sm:inline">Total: {stats.total}</span>
              </div>
              <div className="inline-flex overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm text-black">
                <button
                  onClick={prevPage}
                  disabled={!hasPrev}
                  className="px-4 py-2 text-sm font-semibold text-black hover:bg-slate-50 disabled:opacity-50 disabled:text-black/40"
                >
                  ← Anterior
                </button>
                <div className="px-4 py-2 text-sm font-semibold bg-slate-50 border-x border-slate-200">{page}</div>
                <button
                  onClick={nextPage}
                  disabled={!hasNext}
                  className="px-4 py-2 text-sm font-semibold text-black hover:bg-slate-50 disabled:opacity-50 disabled:text-black/40"
                >
                  Siguiente →
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modales */}
      {editing && (
        <EditModal editing={editing} setEditing={setEditing} onConfirm={onEditConfirm} notify={notify} />
      )}
      {confirmPatch && (
        <ConfirmModal patch={confirmPatch} onCancel={() => setConfirmPatch(null)} onConfirm={confirmSaveYes} />
      )}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="border-b border-slate-200 px-5 py-4">
              <h3 className="text-lg font-semibold text-neutral-900">Eliminar cupo</h3>
            </div>
            <div className="space-y-2 px-5 py-4 text-sm text-neutral-800">
              <p className="text-neutral-700">¿Seguro que deseas eliminar este cupo?</p>
              <div><span className="font-semibold">Servicio:</span> {confirmDelete.service}</div>
              <div><span className="font-semibold">Fecha:</span> {confirmDelete.date}</div>
              <div><span className="font-semibold">Hora:</span> {confirmDelete.time}</div>
            </div>
            <div className="flex gap-2 border-t border-slate-200 px-5 py-4">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 rounded-full border-2 border-slate-200 px-5 py-2 font-semibold text-neutral-700 hover:border-blue-600 hover:text-blue-600">
                Cancelar
              </button>
              <button onClick={confirmDeleteYes} className="flex-1 rounded-full bg-rose-600 px-5 py-2 font-semibold text-white hover:bg-rose-700">
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastProvider>{null}</ToastProvider>
    </div>
  );
}
