// ManageCatalog.tsx
"use client";

import React, { useMemo, useState } from "react";

import { useCatalogState } from "./hooks/useCatalogState";
import { useToast } from "./hooks/useToast";
import { parseError } from "./utils/parseError";

import CatalogStats from "./components/CatalogStats";
import SectionCard from "./components/SectionCard";
import AdminCategoryCard from "./components/AdminCategoryCard";
import Modal from "./components/BaseModal";
import CategoryForm from "./components/CategoryForm";
import ServiceForm from "./components/ServiceForm";
import ServicesModal from "./components/ServicesModal";
import ConfirmModal from "./components/ConfirmModal";
import Toast from "./components/Toast";

export default function ManageCatalog() {
  const {
    // listas y stats
    categories,
    activeCategories,
    otherCategories,
    stats,
    // modales/estados UI
    createOpen, setCreateOpen,
    editOpen, setEditOpen,
    servicesModalFor, setServicesModalFor,
    serviceEditing, setServiceEditing,
    createServiceFor, setCreateServiceFor,
    // acciones
    createCategory, updateCategory, deleteCategory, reactivateCategory,
    createService, deleteService, setServiceActive, updateService,
    // loading global
    loading,
  } = useCatalogState();

  const { toast, showToast } = useToast(2600);

  // ===== Confirmaciones =====
  type PendingCatEdit = { id: string; name: string; description: string; original?: { name: string; description: string } };
  type PendingSvcEdit = { id: string; name: string; durationMinutes: number; original?: { name: string; durationMinutes: number } };

  const [confirmDeleteCat, setConfirmDeleteCat] = useState<{ id: string; name: string; description?: string } | null>(null);
  const [confirmDeleteSvc, setConfirmDeleteSvc] = useState<{ id: string; name: string; duration?: number } | null>(null);

  const [pendingCatEdit, setPendingCatEdit] = useState<PendingCatEdit | null>(null);
  const [pendingSvcEdit, setPendingSvcEdit] = useState<PendingSvcEdit | null>(null);

  // helpers para construir cuerpos del confirm
  const catEditBody = useMemo(() => {
    if (!pendingCatEdit?.original) return null;
    const o = pendingCatEdit.original, n = pendingCatEdit;
    return (
      <>
        <div><span className="font-semibold">Nombre:</span> {o.name} → {n.name}</div>
        <div><span className="font-semibold">Descripción:</span> {o.description} → {n.description}</div>
      </>
    );
  }, [pendingCatEdit]);

  const svcEditBody = useMemo(() => {
    if (!pendingSvcEdit?.original) return null;
    const o = pendingSvcEdit.original, n = pendingSvcEdit;
    return (
      <>
        <div><span className="font-semibold">Nombre:</span> {o.name} → {n.name}</div>
        <div><span className="font-semibold">Duración:</span> {o.durationMinutes} min → {n.durationMinutes} min</div>
      </>
    );
  }, [pendingSvcEdit]);

  return (
    <div className="min-h-screen text-slate-900">
      <main className="mx-auto mt-6 max-w-[1400px] px-6 pb-24">
        <section className="mb-6 rounded-2xl bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.06)] ring-1 ring-slate-100 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">Gestión de Catálogos</h1>
              <p className="mt-1 text-neutral-600">Administra categorías y servicios del sistema.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setCreateOpen(true)}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 px-4 py-2 font-semibold text-white shadow-[0_4px_15px_rgba(37,99,235,0.3)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(37,99,235,0.4)]"
              >
                <span>➕</span> Nueva Categoría
              </button>
            </div>
          </div>
        </section>

        <CatalogStats
          totalCategorias={stats.totalCats}
          categoriasActivas={stats.activeCats}
          serviciosActivos={stats.activeSrv}
          serviciosTotales={stats.totalSrv}
        />

        {/* Activos */}
        <SectionCard title="Catálogos activos" subtitle="Gestiona los catálogos que se encuentran activos" className="mt-6">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-neutral-500">
              <span className="text-black">Cargando…</span>
            </div>
          ) : activeCategories.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
              <h3 className="mb-1 text-lg font-semibold text-neutral-900">No tienes categorías activas</h3>
              <p className="text-neutral-600">Crea una nueva categoría o activa alguna existente</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {activeCategories.map((cat) => (
                <AdminCategoryCard
                  key={cat.id}
                  cat={{
                    id: cat.id,
                    name: cat.name,
                    description: cat.description,
                    icon: "",
                    status: cat.active ? "active" : "inactive",
                    services: cat.services.map((s) => ({
                      id: s.id,
                      name: s.name,
                      duration: `${s.durationMinutes} min`,
                      status: s.active ? "active" : "inactive",
                    })),
                  }}
                  onEdit={() => setEditOpen({ open: true, category: cat })}
                  onDelete={() => setConfirmDeleteCat({ id: cat.id, name: cat.name, description: cat.description })}
                  onActivate={async () => {
                    try { await updateCategory(cat.id, { active: true }); showToast("Categoría activada", "success"); }
                    catch (e: any) { showToast(parseError(e), "error"); }
                  }}
                  onDeactivate={async () => {
                    try { await updateCategory(cat.id, { active: false }); showToast("Categoría desactivada", "success"); }
                    catch (e: any) { showToast(parseError(e), "error"); }
                  }}
                  onViewServices={() => setServicesModalFor(cat)}
                  onAddService={() => setCreateServiceFor(cat)}
                />
              ))}
            </div>
          )}
        </SectionCard>

        {/* Inactivos */}
        <SectionCard title="Catálogos inactivos" subtitle="Gestiona los catálogos que se encuentran inactivos" className="mt-8">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-neutral-500">
              <span className="text-black">Cargando…</span>
            </div>
          ) : otherCategories.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
              <h3 className="mb-1 text-lg font-semibold text-neutral-900">No hay categorías inactivas</h3>
              <p className="text-neutral-600">Todas las categorías están activas o no existen</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {otherCategories.map((cat) => (
                <AdminCategoryCard
                  key={cat.id}
                  cat={{
                    id: cat.id,
                    name: cat.name,
                    description: cat.description,
                    icon: "",
                    status: cat.active ? "active" : "inactive",
                    services: cat.services.map((s) => ({
                      id: s.id,
                      name: s.name,
                      duration: `${s.durationMinutes} min`,
                      status: s.active ? "active" : "inactive",
                    })),
                  }}
                  onEdit={() => setEditOpen({ open: true, category: cat })}
                  onDelete={() => setConfirmDeleteCat({ id: cat.id, name: cat.name, description: cat.description })}
                  onActivate={async () => {
                    try { await reactivateCategory(cat.id); showToast("Categoría reactivada", "success"); }
                    catch (e: any) { showToast(parseError(e), "error"); }
                  }}
                  onDeactivate={async () => {
                    try { await updateCategory(cat.id, { active: false }); showToast("Categoría desactivada", "success"); }
                    catch (e: any) { showToast(parseError(e), "error"); }
                  }}
                  onViewServices={() => setServicesModalFor(cat)}
                  onAddService={() => setCreateServiceFor(cat)}
                />
              ))}
            </div>
          )}
        </SectionCard>
      </main>

      {/* Crear categoría */}
      {createOpen && (
        <Modal onClose={() => setCreateOpen(false)} title="Crear Nueva Categoría">
          <CategoryForm
            onCancel={() => setCreateOpen(false)}
            onSubmit={async (payload) => {
              try {
                await createCategory(payload);
                setCreateOpen(false);
                showToast("Categoría creada", "success");
              } catch (e: any) {
                showToast(parseError(e), "error");
              }
            }}
          />
        </Modal>
      )}

      {/* Editar categoría (abre confirm al guardar) */}
      {editOpen.open && editOpen.category && (
        <Modal onClose={() => setEditOpen({ open: false, category: null })} title="Editar Categoría">
          <CategoryForm
            defaultValues={{ name: editOpen.category.name, description: editOpen.category.description }}
            onCancel={() => setEditOpen({ open: false, category: null })}
            onSubmit={(payload) => {
              setPendingCatEdit({
                id: editOpen.category!.id,
                name: payload.name,
                description: payload.description,
                original: { name: editOpen.category!.name, description: editOpen.category!.description },
              });
            }}
          />
        </Modal>
      )}

      {/* Modal de servicios (sin botón de agregar dentro) */}
      {servicesModalFor && (
        <ServicesModal
          title={`Servicios — ${servicesModalFor.name}`}
          services={servicesModalFor.services.map(s => ({
            id: s.id,
            name: s.name,
            duration: s.durationMinutes,
            active: s.active,
          }))}
          onClose={() => setServicesModalFor(null)}
          onEdit={(svc) => {
            const full = servicesModalFor.services.find(x => x.id === svc.id);
            if (full) setServiceEditing(full);
          }}
          onToggleActive={async (svc, next) => {
            try { await setServiceActive(svc.id, next); showToast("Estado del servicio actualizado", "success"); }
            catch (e:any) { showToast(parseError(e), "error"); }
          }}
          onDelete={(svc) => setConfirmDeleteSvc({ id: svc.id, name: svc.name, duration: svc.duration })}
        />
      )}

      {/* Crear servicio */}
      {createServiceFor && (
        <Modal onClose={() => setCreateServiceFor(null)} title={`Crear servicio — ${createServiceFor.name}`}>
          <ServiceForm
            defaultValues={{ durationMinutes: 30 }}
            onCancel={() => setCreateServiceFor(null)}
            onSubmit={async (payload) => {
              try {
                await createService(createServiceFor.id, { ...payload, active: true });
                setCreateServiceFor(null);
                showToast("Servicio creado", "success");
              } catch (e:any) {
                showToast(parseError(e), "error");
              }
            }}
          />
        </Modal>
      )}

      {/* Editar servicio (abre confirm al guardar) */}
      {serviceEditing && (
        <Modal onClose={() => setServiceEditing(null)} title="Editar servicio">
          <ServiceForm
            defaultValues={{ name: serviceEditing.name, durationMinutes: serviceEditing.durationMinutes }}
            onCancel={() => setServiceEditing(null)}
            onSubmit={(payload) => {
              setPendingSvcEdit({
                id: serviceEditing.id,
                name: payload.name,
                durationMinutes: payload.durationMinutes,
                original: { name: serviceEditing.name, durationMinutes: serviceEditing.durationMinutes },
              });
            }}
          />
        </Modal>
      )}

      {/* Confirmar eliminar categoría */}
      {confirmDeleteCat && (
        <ConfirmModal
          title="Eliminar categoría"
          danger
          body={
            <div className="text-sm space-y-1">
              <div><span className="font-semibold">Categoría:</span> {confirmDeleteCat.name}</div>
              <div><span className="font-semibold">Descripción:</span> {confirmDeleteCat.description ?? "—"}</div>
            </div>
          }
          cancelLabel="Volver"
          confirmLabel="Sí, eliminar"
          onCancel={() => setConfirmDeleteCat(null)}
          onConfirm={async () => {
            try {
              await deleteCategory(confirmDeleteCat.id);
              setConfirmDeleteCat(null);
              showToast("Categoría eliminada", "success");
            } catch (e:any) {
              showToast(parseError(e), "error");
            }
          }}
        />
      )}

      {/* Confirmar eliminar servicio */}
      {confirmDeleteSvc && (
        <ConfirmModal
          title="Eliminar servicio"
          danger
          body={
            <div className="text-sm space-y-1">
              <div><span className="font-semibold">Servicio:</span> {confirmDeleteSvc.name}</div>
              <div><span className="font-semibold">Duración:</span> {typeof confirmDeleteSvc.duration === "number" ? `${confirmDeleteSvc.duration} min` : "—"}</div>
            </div>
          }
          cancelLabel="Volver"
          confirmLabel="Sí, eliminar"
          onCancel={() => setConfirmDeleteSvc(null)}
          onConfirm={async () => {
            try {
              await deleteService(confirmDeleteSvc.id);
              setConfirmDeleteSvc(null);
              showToast("Servicio eliminado", "success");
            } catch (e:any) {
              showToast(parseError(e), "error");
            }
          }}
        />
      )}

      {/* Confirmar guardar edición categoría */}
      {pendingCatEdit && (
        <ConfirmModal
          title="Confirmar cambios"
          body={catEditBody}
          cancelLabel="Volver"
          confirmLabel="Confirmar y guardar"
          onCancel={() => setPendingCatEdit(null)}
          onConfirm={async () => {
            try {
              await updateCategory(pendingCatEdit.id, {
                name: pendingCatEdit.name,
                description: pendingCatEdit.description,
              });
              setPendingCatEdit(null);
              setEditOpen({ open: false, category: null });
              showToast("Categoría actualizada", "success");
            } catch (e:any) {
              showToast(parseError(e), "error");
            }
          }}
        />
      )}

      {/* Confirmar guardar edición servicio */}
      {pendingSvcEdit && (
        <ConfirmModal
          title="Confirmar cambios"
          body={svcEditBody}
          cancelLabel="Volver"
          confirmLabel="Confirmar y guardar"
          onCancel={() => setPendingSvcEdit(null)}
          onConfirm={async () => {
            try {
              await updateService(pendingSvcEdit.id, {
                name: pendingSvcEdit.name,
                durationMinutes: pendingSvcEdit.durationMinutes,
              });
              setPendingSvcEdit(null);
              setServiceEditing(null);
              showToast("Servicio actualizado", "success");
            } catch (e:any) {
              showToast(parseError(e), "error");
            }
          }}
        />
      )}

      <Toast toast={toast} />
    </div>
  );
}
