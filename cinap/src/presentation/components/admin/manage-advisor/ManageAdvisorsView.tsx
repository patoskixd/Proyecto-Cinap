"use client";

import React, { useEffect, useMemo, useState } from "react";
import ManageAdvisorsHeader from "./ManageAdvisorsHeader";
import AdvisorCard from "./AdvisorCard";
import EditAdvisorModal from "./EditAdvisorModal";
import ConfirmDialog from "./ConfirmDialog";

import { ListAdvisors } from "@application/admin-advisors/usecases/ListAdvisors";
import { UpdateAdvisor } from "@application/admin-advisors/usecases/UpdateAdvisors";
import { DeleteAdvisor } from "@application/admin-advisors/usecases/DeleteAdvisor";
import { AdminAdvisorsHttpRepo } from "@infrastructure/admin-advisors/AdminAdvisorsHttpRepo";


import type { Advisor } from "@/domain/adminAdvisors";


const FRONTEND_URL = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";


function createRepos() {
  const advisorsRepo = new AdminAdvisorsHttpRepo();
  return { advisorsRepo };
}


async function loadCatalog(): Promise<any[]> {
  const res = await fetch(`${FRONTEND_URL}/api/admin/catalog/categories`, {
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
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Advisor[]>([]);
  const [query, setQuery] = useState("");
  const [catalog, setCatalog] = useState<any>(null);

  const [editing, setEditing] = useState<Advisor | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; advisor?: Advisor }>({ open: false });
  const [updating, setUpdating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(Date.now());


  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { advisorsRepo } = createRepos();
        const listUC = new ListAdvisors(advisorsRepo);
        
        const [advs, categories] = await Promise.all([
          listUC.exec(),
          loadCatalog()
        ]);
        
        setItems(advs);
        setCatalog(categories);
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const categories = useMemo(() => {
    if (!catalog || !Array.isArray(catalog)) return [];
    return catalog.filter((c: any) => c.active);
  }, [catalog]);

  const categoriesById = useMemo(
    () => new Map(categories.map((c: any) => [c.id, { id: c.id, name: c.name }])),
    [categories],
  );

  const servicesByCategory = useMemo(() => {
    const m = new Map<string, { id: string; name: string }[]>();
    if (!catalog || !Array.isArray(catalog)) return m;
    
    catalog.forEach((category: any) => {
      if (category.active && category.services) {
        m.set(
          category.id,
          category.services
            .filter((s: any) => s.active)
            .map((s: any) => ({ id: s.id, name: s.name }))
        );
      }
    });
    return m;
  }, [catalog]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (a) => a.basic.name.toLowerCase().includes(q) || a.basic.email.toLowerCase().includes(q),
    );
  }, [items, query]);

  const handleSave = async (changes: { id: string; basic: any; categories: any[]; services: any[] }) => {
    setUpdating(true);
    try {
      const { advisorsRepo } = createRepos();
      const updateUC = new UpdateAdvisor(advisorsRepo);
      

      const serviceIds = changes.services.map(service => {
        const id = typeof service === 'string' ? service : service.id;
        return id;
      });
      
      const updateRequest = {
        basic: changes.basic,
        categories: changes.categories,
        services: serviceIds, 
        active: true 
      };
      

      const updatedAdvisor = await updateUC.exec(changes.id, updateRequest);
      

      setItems((prev) => prev.map((x) => (x.id === updatedAdvisor.id ? updatedAdvisor : x)));
      

      setLastUpdate(Date.now());
      

      setTimeout(async () => {
        try {
          const { advisorsRepo } = createRepos();
          const listUC = new ListAdvisors(advisorsRepo);
          const freshList = await listUC.exec();
          setItems(freshList);
        } catch (error) {
        }
      }, 100);
      

      setEditing(null);
    } catch (error) {
      console.error("Error actualizando asesor:", error);
      alert("Error al actualizar el asesor. Intenta de nuevo.");
    } finally {
      setUpdating(false);
    }
  };



  const handleDelete = (advisor: Advisor) => {
    setConfirmDelete({ open: true, advisor });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete.advisor) return;
    
    try {
      const { advisorsRepo } = createRepos();
      const deleteAdvisor = new DeleteAdvisor(advisorsRepo);
      
      await deleteAdvisor.exec(confirmDelete.advisor.id);
      
      setItems((prev) => prev.filter(x => x.id !== confirmDelete.advisor!.id));
      setConfirmDelete({ open: false });
    } catch (error) {
      console.error("Error eliminando asesor permanentemente:", error);
      alert("Error al eliminar el asesor permanentemente. Intenta de nuevo.");
    }
  };

  return (
    <div className="space-y-6">
      <ManageAdvisorsHeader query={query} onQueryChange={setQuery} />
      
      {/* list / empty */}
      {loading ? (
        <div className="rounded-2xl bg-white p-12 shadow-lg border">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Cargando asesores...</h3>
              <p className="text-gray-600">Obteniendo catálogo y información de asesores</p>
            </div>
          </div>
        </div>
      ) : filtered.length === 0 ? (
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
                {query.trim() ? "Ajusta tu búsqueda para encontrar asesores." : "Aún no hay asesores registrados en el sistema."}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2" key={lastUpdate}>
          {filtered.map((a, index) => (
            <AdvisorCard
              key={`advisor-${a.id || index}-${lastUpdate}`}
              advisor={a}
              categoriesById={categoriesById}
              servicesByCat={servicesByCategory}
              onEdit={(adv) => {
                const validCats = (adv.categories || []).filter((cid) => categoriesById.has(cid as string));
                const validSvcs = (adv.services || []).filter((s) => {
                  if (!validCats.includes(s.categoryId)) return false;
                  const svcs = servicesByCategory.get(s.categoryId) ?? [];
                  return svcs.some((x) => x.id === s.id);
                });
                setEditing({
                  ...adv,
                  basic: adv.basic || { name: "", email: "" },
                  categories: validCats,
                  services: validSvcs,
                });
              }}

              onDelete={handleDelete}
            />
          ))}
        </section>
      )}
      {/* modal de edición */}
      <EditAdvisorModal
        open={!!editing}
        advisor={editing}
        catalog={{ categories, servicesByCategory }}
        onClose={() => !updating && setEditing(null)}
        onSave={handleSave}
      />

      {/* confirmación eliminar */}
      
      {confirmDelete.open && (
        <ConfirmDialog
          open={confirmDelete.open}
          title="Eliminar asesor"
          message={`¿Estás seguro de que deseas ELIMINAR a ${confirmDelete.advisor?.basic.name}? Esta acción no se puede deshacer.`}
          confirmText="Eliminar"
          onConfirm={handleConfirmDelete}
          onClose={() => setConfirmDelete({ open: false })}
        />
      )}
    </div>
  );
}
