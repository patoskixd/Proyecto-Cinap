"use client";

import Link from "next/link";
import { useState } from "react";
import type { MySlot } from "@domain/mySlots";
import { useMySlots } from "./hooks/useMySlots";
import FiltersBar from "./components/Filters";
import Stats from "./components/Stats";
import SlotCard from "./components/SlotCard";
import EditModal from "./components/EditModal";
import ConfirmModal from "./components/ConfirmModal";
import Toast from "./components/Toast";

export default function MySlotsManager() {
  const {
    slots, loading, filtered, stats, filters, setFilters,
    updateSlot, deleteSlot, reactivateSlot, disableSlot, selectOptions
  } = useMySlots();

  const [editing, setEditing] = useState<MySlot | null>(null);
  const [confirmPatch, setConfirmPatch] = useState<MySlot | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<MySlot | null>(null);

  const [toast, setToast] = useState<{ msg: string; tone: "info" | "success" | "error" } | null>(null);
  const notify = (msg: string, tone: "info" | "success" | "error" = "info") => {
    setToast({ msg, tone }); setTimeout(() => setToast(null), 2600);
  };

  const startEdit = (id: string) => {
    const s = slots.find(x => x.id === id);
    if (s) setEditing({ ...s });
  };

  const openDelete = (id: string) => {
    const s = slots.find(x => x.id === id);
    if (s) setConfirmDelete(s);
  };

  const confirmDeleteYes = async () => {
    if (!confirmDelete) return;
    try {
      await deleteSlot(confirmDelete.id);
      setConfirmDelete(null);
      notify("Cupo eliminado", "success");
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

  
  return (
    <div className="py-6">
      {/* encabezado */}
      <div className="mb-6 rounded-2xl border border-blue-200 bg-gradient-to-br from-white via-blue-50/30 to-yellow-50/20 p-6 shadow-lg backdrop-blur-sm md:mb-8 md:p-8">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-bold text-blue-900">Mis cupos</h1>
            <p className="mt-1 text-blue-700">
              Configura los cupos que estarán disponibles para los estudiantes.
            </p>
          </div>
          <Link
            href="/asesorias/crear-cupos"
            className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-blue-600 via-blue-700 to-yellow-500 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl hover:scale-105"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Crear cupos
          </Link>
        </div>
      </div>

      {loading ? (
        <>
          {/* filtros deshabilitados durante carga */}
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm opacity-60">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-neutral-900 mb-1">Filtros de búsqueda</h3>
              <p className="text-sm text-neutral-600">Cargando opciones de filtrado...</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>

          {/* stats en estado de carga */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { label: "Cupos totales" },
              { label: "Disponibles" },
              { label: "Horas ocupadas" }
            ].map((item, i) => (
              <div key={i} className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-300 mb-2">--</div>
                  <div className="text-sm font-medium text-neutral-400">{item.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* loading state para lista */}
          <div className="rounded-2xl bg-white p-8 text-center border border-gray-200">
            <div className="flex items-center justify-center gap-3">
              <div className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-blue-700 font-medium">Cargando cupos...</span>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* filtros */}
          <FiltersBar value={filters} onChange={setFilters} options={selectOptions} />

          {/* stats */}
          <Stats total={slots.length} disponibles={stats.disponibles} ocupadasHM={stats.ocupadasHM} />

          {/* lista */}
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
              <h3 className="mb-1 text-lg font-semibold text-neutral-900">No hay cupos</h3>
              <p className="mb-4 text-neutral-600">Crea tu primer cupo para comenzar</p>
              <Link href="/asesorias/crear-cupos" className="rounded-full bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700">
                Crear cupo
              </Link>
            </div>
          ) : (
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
          )}
        </>
      )}

      {/* Modal editar */}
      {editing && (
        <EditModal
          editing={editing}
          setEditing={setEditing}
          onConfirm={onEditConfirm}
          notify={notify}
        />
      )}

      {/* Confirmar cambios */}
      {confirmPatch && (
        <ConfirmModal
          patch={confirmPatch}
          onCancel={() => setConfirmPatch(null)}
          onConfirm={confirmSaveYes}
        />
      )}

      {/* Confirmar eliminación */}
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

      {/* toast */}
      {toast && <Toast msg={toast.msg} tone={toast.tone} />}
    </div>
  );
}
