"use client";

import React, { useEffect, useMemo, useState } from "react";
import ManageAdvisorsHeader from "./ManageAdvisorsHeader";
import AdvisorCard from "./AdvisorCard";
import EditAdvisorModal from "./EditAdvisorModal";
import ConfirmDialog from "./ConfirmDialog";

import { InMemoryAdvisorsRepo } from "@infrastructure/advisors/InMemoryAdvisorsRepo";
import { GetAdvisorCatalog } from "@application/advisor-catalog/usecases/GetAdvisorCatalog";
import { AdvisorCatalogHttpRepo } from "@infrastructure/advisor-catalog/AdvisorCatalogHttpRepo";
import { ListAdvisors } from "@application/advisors/usecases/ListAdvisors";
import { UpdateAdvisor } from "@application/advisors/usecases/UpdateAdvisor";
import { DeleteAdvisor } from "@application/advisors/usecases/DeleteAdvisor";

import type { Advisor } from "@domain/advisors";

const advisorsRepo = new InMemoryAdvisorsRepo();
const listUC = new ListAdvisors(advisorsRepo);
const updateUC = new UpdateAdvisor(advisorsRepo);
const deleteUC = new DeleteAdvisor(advisorsRepo);

const catalogRepo = new AdvisorCatalogHttpRepo();
const getCatalogUC = new GetAdvisorCatalog(catalogRepo);

export default function ManageAdvisorsView() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Advisor[]>([]);
  const [query, setQuery] = useState("");
  const [catalog, setCatalog] = useState<any>(null);

  const [editing, setEditing] = useState<Advisor | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id?: string }>(() => ({ open: false }));

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [advs, cat] = await Promise.all([listUC.exec(), getCatalogUC.exec()]);
      setItems(advs);
      setCatalog(cat);
      setLoading(false);
    })();
  }, []);

  const categories = useMemo(() => {
    if (!catalog) return [];
    const seen = new Set<string>();
    return [...catalog.active, ...catalog.available]
      .map((c: any) => c.category)
      .filter((c: any) => (seen.has(c.id) ? false : (seen.add(c.id), true)));
  }, [catalog]);

  const categoriesById = useMemo(
    () => new Map(categories.map((c: any) => [c.id, { id: c.id, name: c.name, icon: c.icon }])),
    [categories],
  );

  const servicesByCategory = useMemo(() => {
    const m = new Map<string, { id: string; name: string }[]>();
    if (!catalog) return m;
    [...catalog.active, ...catalog.available].forEach(({ category, services }: any) => {
      m.set(
        category.id,
        (services ?? []).map((s: any) => ({ id: s.id, name: s.name })),
      );
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
    const updated = await updateUC.exec(changes);
    setItems((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
  };

  const handleDelete = async (id: string) => {
    await deleteUC.exec(id);
    setItems((prev) => prev.filter((x) => x.id !== id));
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-neutral-500">
        Cargando…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ManageAdvisorsHeader query={query} onQueryChange={setQuery} />
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {filtered.map((a) => (
          <AdvisorCard
            key={a.id}
            advisor={a}
            categoriesById={categoriesById}
            servicesByCat={servicesByCategory}
            onEdit={(adv) => {
              const validCats = adv.categories.filter((cid) => categoriesById.has(cid as string))
              const validSvcs = adv.services.filter((s) => {
                if (!validCats.includes(s.categoryId)) return false;
                const svcs = servicesByCategory.get(s.categoryId) ?? [];
                return svcs.some((x) => x.id === s.id);
              });
              setEditing({
                ...adv,
                categories: validCats,
                services: validSvcs,
              });
            }}
            onDelete={(adv) => setConfirmDelete({ open: true, id: adv.id })}
          />
        ))}
      </section>
      {/* modal de edición */}
      <EditAdvisorModal
        open={!!editing}
        advisor={editing}
        catalog={{ categories, servicesByCategory }}
        onClose={() => setEditing(null)}
        onSave={handleSave}
      />

      {/* confirmación eliminar */}
      <ConfirmDialog
        open={confirmDelete.open}
        title="Eliminar asesor"
        message="¿Deseas eliminar este asesor? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        onConfirm={() => {
          if (confirmDelete.id) handleDelete(confirmDelete.id);
        }}
        onClose={() => setConfirmDelete({ open: false })}
      />
    </div>
  );
}
