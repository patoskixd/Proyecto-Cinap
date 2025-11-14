"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Advisor } from "@/domain/admin/advisors";

import { AdminAdvisorsHttpRepo } from "@/infrastructure/admin/advisors/AdminAdvisorsHttpRepo";
import { ListAdvisors } from "@/application/admin/advisors/usecases/ListAdvisors";
import { UpdateAdvisor } from "@/application/admin/advisors/usecases/UpdateAdvisors";
import { DeleteAdvisor } from "@/application/admin/advisors/usecases/DeleteAdvisor";

import ManageAdvisorsHeader from "./ManageAdvisorsHeader";
import AdvisorCard from "./AdvisorCard";
import EditAdvisorModal from "./EditAdvisorModal";
import ConfirmDialog from "./ConfirmDialog";
import { notify } from "@/presentation/components/shared/Toast";

import type { AdvisorId } from "@/domain/admin/advisors";

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 350;

async function loadCatalog(): Promise<any[]> {
  const res = await fetch("/api/admin/catalog/categories", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("No se pudieron cargar las categorías");
  }

  return res.json();
}

export default function ManageAdvisorsView() {
  const advisorsRepo = useMemo(() => new AdminAdvisorsHttpRepo(), []);
  const listUC = useMemo(() => new ListAdvisors(advisorsRepo), [advisorsRepo]);
  const updateUC = useMemo(() => new UpdateAdvisor(advisorsRepo), [advisorsRepo]);
  const deleteUC = useMemo(() => new DeleteAdvisor(advisorsRepo), [advisorsRepo]);

  const [loading, setLoading] = useState(true);
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [editing, setEditing] = useState<Advisor | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; advisor?: Advisor }>({ open: false });

  const [searchValue, setSearchValue] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [reloadToken, setReloadToken] = useState(0);

  const [catalog, setCatalog] = useState<any[]>([]);

  useEffect(() => {
    let alive = true;
    loadCatalog()
      .then((data) => {
        if (alive) setCatalog(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error("Error cargando catálogo:", err))
      .finally(() => {
      });
    return () => {
      alive = false;
    };
  }, []);

  const categories = useMemo(() => {
    return catalog.filter((c: any) => c?.active).map((c: any) => ({ id: c.id, name: c.name }));
  }, [catalog]);

  const categoriesById = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );

  const servicesByCategory = useMemo(() => {
    const map = new Map<string, { id: string; name: string }[]>();
    catalog.forEach((category: any) => {
      if (!category?.services) return;
      map.set(
        category.id,
        category.services
          .filter((svc: any) => svc?.active)
          .map((svc: any) => ({ id: svc.id, name: svc.name })),
      );
    });
    return map;
  }, [catalog]);

  const serviceOptions = useMemo(() => {
    if (!categoryId) return [];
    return servicesByCategory.get(categoryId) ?? [];
  }, [categoryId, servicesByCategory]);

  const loadAdvisors = useCallback(
    async (pageValue: number, searchValue: string, categoryValue: string, serviceValue: string) => {
      setLoading(true);
      try {
        const data = await listUC.exec({
          page: pageValue,
          limit: PAGE_SIZE,
          query: searchValue.trim() || undefined,
          categoryId: categoryValue || undefined,
          serviceId: serviceValue || undefined,
        });
        setAdvisors(data.items);
        setPage(data.page);
        setPages(data.pages);
        setTotal(data.total);
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("Error cargando asesores:", error);
        }
      } finally {
        setLoading(false);
      }
    },
    [listUC],
  );

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedQuery(searchValue);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [searchValue]);

  useEffect(() => {
    loadAdvisors(page, debouncedQuery, categoryId, serviceId);
  }, [page, debouncedQuery, categoryId, serviceId, reloadToken, loadAdvisors]);

  const handleQueryChange = (value: string) => {
    setPage(1);
    setSearchValue(value);
  };

  const handleCategoryChange = (id: string) => {
    setCategoryId(id);
    setServiceId("");
    setPage(1);
  };

  const handleServiceChange = (id: string) => {
    setServiceId(id);
    setPage(1);
  };

  const handleSave = async (changes: { id: AdvisorId; basic: any; categories: any[]; services: any[] }) => {
    setLoading(true);
    try {
      const serviceIds = changes.services.map((service) => (typeof service === "string" ? service : service.id));
      await updateUC.exec(changes.id, {
        basic: changes.basic,
        categories: changes.categories,
        services: serviceIds,
        active: true,
      });
      setReloadToken((r) => r + 1);
      setEditing(null);
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Error actualizando asesor:", error);
      }
      alert("Error al actualizar el asesor. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete.advisor) return;
    try {
      await deleteUC.exec(confirmDelete.advisor.id);
      const targetPage = advisors.length === 1 && page > 1 ? page - 1 : page;
      if (targetPage !== page) {
        setPage(targetPage);
      } else {
        setReloadToken((r) => r + 1);
      }
      setConfirmDelete({ open: false });
      notify(`Se eliminó al asesor ${confirmDelete.advisor.basic.name ?? ""} correctamente.`, "success");
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Error eliminando asesor:", error);
      }
      let message = "No se pudo eliminar el asesor. Intenta de nuevo.";
      if (error instanceof Error && error.message) {
        const raw = error.message.trim();
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (parsed?.detail || parsed?.message) {
              message = parsed.detail || parsed.message;
            } else {
              message = raw;
            }
          } catch {
            message = raw;
          }
        }
      } else if (typeof error === "string" && error.trim()) {
        message = error.trim();
      }
      notify(message, "error");
    }
  };

  const filteredAdvisors = useMemo(() => {
    const term = debouncedQuery.trim().toLowerCase();
    return advisors.filter((advisor) => {
      if (term) {
        const name = advisor.basic?.name?.toLowerCase() ?? "";
        const email = advisor.basic?.email?.toLowerCase() ?? "";
        if (!name.includes(term) && !email.includes(term)) {
          return false;
        }
      }
      if (categoryId) {
        const categories = Array.isArray(advisor.categories) ? advisor.categories : [];
        const matchesCategory = categories.some((cid) => String(cid) === String(categoryId));
        if (!matchesCategory) {
          return false;
        }
      }
      if (serviceId) {
        const services = Array.isArray(advisor.services) ? advisor.services : [];
        const matchesService = services.some((service) => String(service.id) === String(serviceId));
        if (!matchesService) {
          return false;
        }
      }
      return true;
    });
  }, [advisors, categoryId, serviceId, debouncedQuery]);

  const filteredTotal = filteredAdvisors.length;
  const displayedTotal = useMemo(() => {
    if (debouncedQuery.trim() || categoryId || serviceId) {
      return filteredTotal;
    }
    return total;
  }, [filteredTotal, total, debouncedQuery, categoryId, serviceId]);

  const hasPrev = page > 1;
  const hasNext = page < pages;
  const isEmpty = !loading && filteredTotal === 0;

  return (
    <div className="space-y-6">
      <ManageAdvisorsHeader
        query={searchValue}
        onQueryChange={handleQueryChange}
        categoryId={categoryId}
        onCategoryChange={handleCategoryChange}
        serviceId={serviceId}
        onServiceChange={handleServiceChange}
        categories={categories}
        services={serviceOptions}
        total={displayedTotal}
        onReset={() => {
          setPage(1);
          setSearchValue("");
          setDebouncedQuery("");
          setCategoryId("");
          setServiceId("");
          setReloadToken((r) => r + 1);
        }}
      />

      {loading ? (
        <div className="rounded-2xl bg-white p-12 shadow-lg border">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Cargando asesores...</h3>
              <p className="text-gray-600">Obteniendo catálogo y datos más recientes</p>
            </div>
          </div>
        </div>
      ) : isEmpty ? (
        <div className="rounded-2xl bg-white p-12 shadow-lg border text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-gray-100 to-blue-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No se encontraron asesores</h3>
              <p className="text-gray-600">
                {debouncedQuery.trim() || categoryId || serviceId
                  ? "Ajusta los filtros de búsqueda para encontrar resultados."
                  : "Aún no hay asesores registrados en el sistema."}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredAdvisors.map((advisor) => (
            <AdvisorCard
              key={advisor.id}
              advisor={advisor}
              categoriesById={categoriesById}
              servicesByCat={servicesByCategory}
              onEdit={(adv) => {
                const validCategories = (adv.categories || []).filter((cid) => categoriesById.has(cid));
                const validServices = (adv.services || []).filter((svc) =>
                  validCategories.includes(svc.categoryId),
                );
                setEditing({
                  ...adv,
                  categories: validCategories,
                  services: validServices,
                });
              }}
              onDelete={(adv) => setConfirmDelete({ open: true, advisor: adv })}
            />
          ))}
        </section>
      )}

      {!loading && pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-blue-900">
                Página <span className="font-semibold">{page}</span> de <span className="font-semibold">{pages}</span> · Total:{" "}
                <span className="font-semibold">{total}</span>
              </div>
              <div className="inline-flex overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm text-black">
                <button
                  onClick={() => hasPrev && setPage((p) => Math.max(1, p - 1))}
                  disabled={!hasPrev}
                  className="px-4 py-2 text-sm font-semibold text-black hover:bg-slate-50 disabled:opacity-50 disabled:text-black/40"
                  >
                  ← Anterior
                </button>
                <div className="px-4 py-2 text-sm font-semibold bg-slate-50 border-x border-slate-200">{page}</div>
                <button
                  onClick={() => hasNext && setPage((p) => Math.min(pages, p + 1))}
                  disabled={!hasNext}
                  className="px-4 py-2 text-sm font-semibold text-black hover:bg-slate-50 disabled:opacity-50 disabled:text-black/40"
                >
                  Siguiente →
                </button>
              </div>
        </div>
      )}

      {editing && (
        <EditAdvisorModal
          open={!!editing}
          advisor={editing}
          catalog={{ categories, servicesByCategory }}
          onClose={() => setEditing(null)}
          onSave={handleSave}
        />
      )}

      {confirmDelete.open && (
        <ConfirmDialog
          open={confirmDelete.open}
          title="Eliminar asesor"
          message={`¿Estás seguro de que deseas eliminar a ${confirmDelete.advisor?.basic.name}? Esta acción no se puede deshacer.`}
          confirmText="Eliminar"
          onConfirm={handleConfirmDelete}
          onClose={() => setConfirmDelete({ open: false })}
        />
      )}
    </div>
  );
}

