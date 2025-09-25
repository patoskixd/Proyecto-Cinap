"use client";

import { useEffect, useMemo, useState } from "react";
import type { AdminCategory, AdminService } from "@domain/adminCatalog";
import { AdminCatalogHttpRepo } from "@infrastructure/admin-catalog/AdminCatalogHttpRepo";

// Use cases (según tus rutas actuales)
import ListCategories from "@/application/admin-catalog/usecases/ListCategories";
import CreateCategory from "@/application/admin-catalog/usecases/Category/CreateCategory";
import UpdateCategory from "@/application/admin-catalog/usecases/Category/UpdateCategory";
import DeleteCategory from "@/application/admin-catalog/usecases/Category/DeleteCategory";
import ReactivateCategory from "@/application/admin-catalog/usecases/Category/ReactivateCategory";

import CreateService from "@/application/admin-catalog/usecases/Service/CreateService";
import UpdateService from "@/application/admin-catalog/usecases/Service/UpdateService";
import DeleteService from "@/application/admin-catalog/usecases/Service/DeleteService";

type EditOpenState = { open: boolean; category: AdminCategory | null };

export function useCatalogState() {
  // ====== casos de uso / repo ======
  const repo = useMemo(() => new AdminCatalogHttpRepo(), []);
  const ucList = useMemo(() => new ListCategories(repo), [repo]);
  const ucCreate = useMemo(() => new CreateCategory(repo), [repo]);
  const ucUpdate = useMemo(() => new UpdateCategory(repo), [repo]);
  const ucDelete = useMemo(() => new DeleteCategory(repo), [repo]);
  const ucReactivate = useMemo(() => new ReactivateCategory(repo), [repo]);

  const ucCreateService = useMemo(() => new CreateService(repo), [repo]);
  const ucUpdateService = useMemo(() => new UpdateService(repo), [repo]);
  const ucDeleteService = useMemo(() => new DeleteService(repo), [repo]);

  // ====== estado ======
  const [loading, setLoading] = useState<boolean>(true);

  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState<EditOpenState>({ open: false, category: null });

  const [servicesModalFor, setServicesModalFor] = useState<AdminCategory | null>(null);
  const [serviceEditing, setServiceEditing] = useState<AdminService | null>(null);
  const [createServiceFor, setCreateServiceFor] = useState<AdminCategory | null>(null);

  // carga inicial
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const data = await ucList.exec();
        if (alive) setCategories(data);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [ucList]);

  // derivados
  const activeCategories = useMemo(() => categories.filter(c => c.active), [categories]);
  const otherCategories  = useMemo(() => categories.filter(c => !c.active), [categories]);

  const stats = useMemo(() => {
    const totalCats = categories.length;
    const activeCats = activeCategories.length;
    const allServices = categories.flatMap(c => c.services);
    const totalSrv = allServices.length;
    const activeSrv = allServices.filter(s => s.active).length;
    return { totalCats, activeCats, totalSrv, activeSrv };
  }, [categories, activeCategories]);

  // ====== helpers ======
  function upsertCategory(next: AdminCategory) {
    setCategories(prev => {
      const i = prev.findIndex(c => c.id === next.id);
      if (i === -1) return [next, ...prev];
      const copy = [...prev]; copy[i] = next; return copy;
    });
  }
  function removeCategory(id: string) {
    setCategories(prev => prev.filter(c => c.id !== id));
  }
  // ayuda para mantener sincronizado el modal de servicios si está abierto
  const patchServicesModal = (categoryId: string, updater: (svcs: AdminService[]) => AdminService[]) =>
    setServicesModalFor(prev =>
      prev && prev.id === categoryId ? ({ ...prev, services: updater(prev.services) } as AdminCategory) : prev
    );

  function applyServiceEdit(saved: AdminService) {
    setCategories(prev => prev.map(c =>
      c.id !== saved.categoryId ? c : ({ ...c, services: c.services.map(x => x.id === saved.id ? saved : x) })
    ));
    patchServicesModal(saved.categoryId, svcs => svcs.map(x => x.id === saved.id ? saved : x));
  }

  // ====== acciones categoría ======
  async function createCategory(payload: { name: string; description: string }) {
    const cat = await ucCreate.exec(payload);
    upsertCategory(cat);
    return cat;
  }
  async function updateCategory(id: string, patch: { name?: string; description?: string; active?: boolean }) {
    const cat = await ucUpdate.exec(id, patch);
    upsertCategory(cat);
    return cat;
  }
  async function deleteCategory(id: string) {
    await ucDelete.exec(id);
    removeCategory(id);
  }
  async function reactivateCategory(id: string) {
    const cat = await ucReactivate.exec(id);
    upsertCategory(cat);
    return cat;
  }

  // ====== acciones servicio ======
  async function setServiceActive(id: string, active: boolean) {
    const saved = await ucUpdateService.exec(id, { active });
    applyServiceEdit(saved);
    return saved;
  }
  async function deleteService(id: string) {
    await ucDeleteService.exec(id);
    // detectar categoría para mantener modal
    const catId = categories.find(c => c.services.some(s => s.id === id))?.id;
    setCategories(prev => prev.map(c => ({ ...c, services: c.services.filter(s => s.id !== id) })));
    if (catId) patchServicesModal(catId, svcs => svcs.filter(s => s.id !== id));
  }
  async function createService(categoryId: string, payload: { name: string; durationMinutes: number; active?: boolean }) {
    const saved = await ucCreateService.exec(categoryId, payload);
    setCategories(prev => prev.map(c =>
      c.id !== categoryId ? c : ({ ...c, services: [saved, ...c.services] })
    ));
    patchServicesModal(categoryId, svcs => [saved, ...svcs]);
    return saved;
  }
  async function updateService(id: string, patch: { name?: string; durationMinutes?: number; active?: boolean }) {
    const saved = await ucUpdateService.exec(id, patch);
    applyServiceEdit(saved);
    return saved;
  }

  return {
    // listas y stats
    categories,
    activeCategories,
    otherCategories,
    stats,
    // loading global
    loading,

    // estados UI (modales y edición)
    createOpen, setCreateOpen,
    editOpen, setEditOpen,
    servicesModalFor, setServicesModalFor,
    serviceEditing, setServiceEditing,
    createServiceFor, setCreateServiceFor,

    // acciones
    createCategory,
    updateCategory,
    deleteCategory,
    reactivateCategory,

    createService,
    deleteService,
    setServiceActive,
    updateService,
  };
}

export default useCatalogState;
