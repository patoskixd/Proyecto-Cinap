// ManageCatalog.tsx
"use client";

import React, { useMemo, useState } from "react";

import { useCatalogState } from "./hooks/useCatalogState";
import { parseError } from "./utils/parseError";

import CatalogStats from "./components/CatalogStats";
import SectionCard from "./components/SectionCard";
import AdminCategoryCard from "./components/AdminCategoryCard";
import Modal from "./components/BaseModal";
import CategoryForm from "./components/CategoryForm";
import ServiceForm from "./components/ServiceForm";
import ServicesModal from "./components/ServicesModal";
import ConfirmModal from "./components/ConfirmModal";
import ToastProvider, { notify } from "../../shared/Toast/ToastProvider";
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

  //const { toast, showToast } = useToast(2600);

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
    <div className="min-h-screen">
      <main className="mx-auto mt-6 max-w-[1400px] px-6 pb-24">
        <div className="mb-6 rounded-2xl border border-blue-200 bg-gradient-to-br from-white via-blue-50/30 to-yellow-50/20 p-6 shadow-lg backdrop-blur-sm md:mb-8 md:p-8">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h1 className="text-3xl font-bold text-blue-900">
                Gestión de Catálogos
              </h1>
              <p className="mt-1 text-blue-700">Administra categorías y servicios del sistema.</p>
            </div>
            <button
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-blue-600 via-blue-700 to-yellow-500 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl hover:scale-105"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Nueva Categoría
            </button>
          </div>
        </div>        <CatalogStats
          totalCategorias={stats.totalCats}
          categoriasActivas={stats.activeCats}
          serviciosActivos={stats.activeSrv}
          serviciosTotales={stats.totalSrv}
        />

        {/* Activos */}
        <SectionCard title="Catálogos activos" subtitle="Gestiona los catálogos que se encuentran activos" className="mt-6">
          {loading ? (
            <div className="rounded-2xl bg-white p-8 text-center border border-gray-200">
              <div className="flex items-center justify-center gap-3">
                <div className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-blue-700 font-medium">Cargando categorías...</span>
              </div>
            </div>
          ) : activeCategories.length === 0 ? (
            <div className="rounded-2xl bg-white p-12 text-center border border-gray-200">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">No tienes categorías activas</h3>
              <p className="text-gray-600">Crea una nueva categoría o activa alguna existente</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 items-start">
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
                    try { await updateCategory(cat.id, { active: true }); notify("Categoría activada", "success"); }
                    catch (e: any) { notify(parseError(e), "error"); }
                  }}
                  onDeactivate={async () => {
                    try { await updateCategory(cat.id, { active: false }); notify("Categoría desactivada", "success"); }
                    catch (e: any) { notify(parseError(e), "error"); }
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
            <div className="rounded-2xl bg-white p-8 text-center border border-gray-200">
              <div className="flex items-center justify-center gap-3">
                <div className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-blue-700 font-medium">Cargando categorías...</span>
              </div>
            </div>
          ) : otherCategories.length === 0 ? (
            <div className="rounded-2xl bg-white p-12 text-center border border-gray-200">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">No hay categorías inactivas</h3>
              <p className="text-gray-600">Todas las categorías están activas o no existen</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 items-start">
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
                    try { await reactivateCategory(cat.id); notify("Categoría reactivada", "success"); }
                    catch (e: any) { notify(parseError(e), "error"); }
                  }}
                  onDeactivate={async () => {
                    try { await updateCategory(cat.id, { active: false }); notify("Categoría desactivada", "success"); }
                    catch (e: any) { notify(parseError(e), "error"); }
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
                notify("Categoría creada", "success");
              } catch (e: any) {
                notify(parseError(e), "error");
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
            try { await setServiceActive(svc.id, next); notify("Estado del servicio actualizado", "success"); }
            catch (e:any) { notify(parseError(e), "error"); }
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
                notify("Servicio creado", "success");
              } catch (e:any) {
                notify(parseError(e), "error");
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
              notify("Categoría eliminada", "success");
            } catch (e:any) {
              notify(parseError(e), "error");
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
              notify("Servicio eliminado", "success");
            } catch (e:any) {
              notify(parseError(e), "error");
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
              notify("Categoría actualizada", "success");
            } catch (e:any) {
              notify(parseError(e), "error");
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
              notify("Servicio actualizado", "success");
            } catch (e:any) {
              notify(parseError(e), "error");
            }
          }}
        />
      )}

      <ToastProvider>{null}</ToastProvider>
    </div>
  );
}
