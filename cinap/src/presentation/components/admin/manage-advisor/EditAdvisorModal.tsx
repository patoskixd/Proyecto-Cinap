"use client";
import React, { useEffect, useMemo, useState } from "react";
import type { Advisor, AdvisorBasicInfo, AdvisorServiceRef, CategoryId } from "@domain/advisors";

type CatalogCategory = { id: string; name: string; icon?: string };
type CatalogService  = { id: string; name: string; description?: string; duration?: string };

type Props = {
  open: boolean;
  advisor: Advisor | null;
  catalog: {
    categories: CatalogCategory[];
    servicesByCategory: Map<string, CatalogService[]>;
  };
  onClose: () => void;
  onSave: (changes: { id: string; basic: AdvisorBasicInfo; categories: CategoryId[]; services: AdvisorServiceRef[] }) => void;
};

export default function EditAdvisorModal({ open, advisor, catalog, onClose, onSave }: Props) {
  const [basic, setBasic] = useState<AdvisorBasicInfo>({ name: "", email: "" });
  const [categories, setCategories] = useState<CategoryId[]>([]);
  const [services, setServices] = useState<AdvisorServiceRef[]>([]);
  const [askConfirm, setAskConfirm] = useState(false);

  useEffect(() => {
    if (advisor) {
      setBasic({ ...advisor.basic });
      setCategories([...advisor.categories]);
      setServices([...advisor.services]);
    }
  }, [advisor]);

  const selectedSet = useMemo(() => new Set(categories), [categories]);

  const toggleCategory = (cid: CategoryId) => {
  setCategories((prev) => {
    const has = prev.includes(cid);
    const next = has ? prev.filter((x) => x !== cid) : [...prev, cid];
    if (has) setServices((s) => s.filter((x) => x.categoryId !== cid)); 
    return next;
  });
};


  const toggleService = (svc: AdvisorServiceRef) => {
    setServices((prev) => {
      const key = `${svc.categoryId}__${svc.id}`;
      const exists = prev.some((p) => `${p.categoryId}__${p.id}` === key);
      return exists ? prev.filter((p) => `${p.categoryId}__${p.id}` !== key) : [...prev, svc];
    });
  };

  if (!open || !advisor) return null;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/50 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
        <div className="flex items-start justify-between px-6 pt-6">
          <div>
            <h3 className="text-lg font-bold text-neutral-900">Editar asesor</h3>
            <p className="text-sm text-neutral-600">Actualiza datos, categorías y servicios</p>
          </div>
          <button onClick={onClose} className="rounded-full px-3 py-1 text-2xl leading-none text-slate-500 hover:bg-slate-100">×</button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-4">
          {/* Datos básicos */}
          <div className="rounded-xl border border-slate-200 p-4">
            <h4 className="mb-2 text-sm font-semibold text-neutral-900">Datos básicos</h4>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-neutral-800">Nombre *</span>
                <input
                  className="rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-black outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  value={basic.name}
                  onChange={(e) => setBasic((b) => ({ ...b, name: e.target.value }))}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-neutral-800">Correo *</span>
                <input
                  type="email"
                  className="rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-black outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  value={basic.email}
                  onChange={(e) => setBasic((b) => ({ ...b, email: e.target.value }))}
                />
              </label>
            </div>
          </div>

          {/* Categorías */}
          <div className="mt-4 rounded-xl border border-slate-200 p-4">
            <h4 className="mb-2 text-sm font-semibold text-neutral-900">Categorías</h4>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {catalog.categories.map((c) => {
                const active = selectedSet.has(c.id as CategoryId);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCategory(c.id as CategoryId)}
                    className={`w-full rounded-xl border-2 p-3 text-left transition ${
                      active ? "border-blue-600 bg-blue-50" : "border-slate-200 bg-white hover:border-blue-500"
                    }`}
                  >
                    <div className="font-semibold text-neutral-900">{c.name}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Servicios por categoría seleccionada */}
          {categories.map((cid) => {
            const svcs = catalog.servicesByCategory.get(cid as string) ?? [];
            if (!svcs.length) return null;
            return (
              <div key={`svc_${cid}`} className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="mb-2 text-sm font-semibold text-neutral-900">
                  Servicios en {catalog.categories.find((c) => c.id === cid)?.name ?? cid}
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {svcs.map((s) => {
                    const ref = { categoryId: cid, id: s.id };
                    const key = `${cid}__${s.id}`;
                    const on = services.some((p) => `${p.categoryId}__${p.id}` === key);
                    return (
                      <label
                        key={key}
                        className={`flex cursor-pointer items-center justify-between rounded-lg border-2 px-3 py-2 ${
                          on ? "border-blue-600 bg-white" : "border-slate-200 bg-white hover:border-blue-500"
                        }`}
                      >
                        <span className="text-sm font-medium text-neutral-900">{s.name}</span>
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-blue-600"
                          checked={on}
                          onChange={() => toggleService(ref)}
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-full border-2 border-slate-200 px-4 py-2 text-sm font-semibold text-neutral-700 hover:border-blue-600 hover:text-blue-600"
          >
            Cancelar
          </button>
          <button
            onClick={() => setAskConfirm(true)}
            className="rounded-full bg-gradient-to-br from-blue-600 to-blue-700 px-5 py-2 text-sm font-semibold text-white"
          >
            Guardar cambios
          </button>
        </div>
      </div>

      {/* confirmación */}
      {askConfirm && (
        <div className="fixed inset-0 z-[110] grid place-items-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl ring-1 ring-slate-200">
            <div className="mb-2 text-4xl">✅</div>
            <h4 className="mb-1 text-lg font-bold text-neutral-900">Confirmar edición</h4>
            <p className="mb-4 text-sm text-neutral-600">¿Deseas guardar los cambios realizados?</p>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setAskConfirm(false)}
                className="rounded-full border-2 border-slate-200 px-4 py-2 text-sm font-semibold text-neutral-700 hover:border-blue-600 hover:text-blue-600"
              >
                Volver
              </button>
              <button
                onClick={() => {
                  onSave({ id: advisor.id, basic, categories, services });
                  setAskConfirm(false);
                  onClose();
                }}
                className="rounded-full bg-gradient-to-br from-blue-600 to-blue-700 px-5 py-2 text-sm font-semibold text-white"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
