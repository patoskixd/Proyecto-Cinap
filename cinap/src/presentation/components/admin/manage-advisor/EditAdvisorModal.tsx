"use client";
import React, { useEffect, useMemo, useState } from "react";
import type { Advisor, AdvisorBasicInfo, AdvisorServiceRef, CategoryId } from "@/domain/admin/advisors";

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
  onSave: (changes: { id: string; basic: AdvisorBasicInfo; categories: CategoryId[]; services: AdvisorServiceRef[] }) => Promise<void>;
};

export default function EditAdvisorModal({ open, advisor, catalog, onClose, onSave }: Props) {
  const [basic, setBasic] = useState<AdvisorBasicInfo>({ name: "", email: "" });
  const [categories, setCategories] = useState<CategoryId[]>([]);
  const [services, setServices] = useState<AdvisorServiceRef[]>([]);
  const [askConfirm, setAskConfirm] = useState(false);

  useEffect(() => {
    if (advisor) {
      setBasic({ 
        name: advisor.basic?.name || "",
        email: advisor.basic?.email || ""
      });
      setCategories([...(advisor.categories || [])]);
      setServices([...(advisor.services || [])]);
    } else {
      // Reset when advisor is null
      setBasic({ name: "", email: "" });
      setCategories([]);
      setServices([]);
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
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-4xl max-h-[95vh] bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 overflow-hidden transform animate-in zoom-in-95 duration-200 flex flex-col">
        {/* Header con gradiente */}
        <div className="h-16 sm:h-20 bg-gradient-to-r from-blue-600 via-blue-700 to-yellow-500 relative flex-shrink-0">
          <div className="absolute inset-0 bg-black/10"></div>
          <button
            className="absolute top-3 right-3 sm:top-4 sm:right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-all duration-200"
            onClick={onClose}
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contenido del modal */}
        <div className="px-4 sm:px-8 py-4 sm:py-6 -mt-4 sm:-mt-6 relative flex-shrink-0">
          {/* Ícono del modal */}
          <div className="flex justify-center mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full shadow-xl border-4 border-white flex items-center justify-center">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </div>
          </div>

          <div className="text-center mb-4 sm:mb-6">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Editar Asesor</h3>
            <p className="text-sm sm:text-base text-gray-600">Actualiza datos, categorías y servicios</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-2 sm:py-4">
          {/* Datos básicos */}
          <div className="rounded-lg sm:rounded-xl border-2 border-blue-200 bg-blue-50/30 p-4 sm:p-6 mb-4 sm:mb-6">
            <h4 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
              </svg>
              Datos básicos
            </h4>
            <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
              <label className="block">
                <span className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">Nombre *</span>
                <input
                  className="w-full rounded-lg sm:rounded-xl border-2 border-blue-200 bg-white/90 px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-gray-900 placeholder-gray-500 outline-none transition-all duration-300 focus:border-yellow-500 focus:ring-2 sm:focus:ring-4 focus:ring-yellow-100 focus:bg-white"
                  placeholder="Ingresa el nombre completo"
                  value={basic.name || ""}
                  onChange={(e) => setBasic((b) => ({ ...b, name: e.target.value }))}
                />
              </label>
              <label className="block">
                <span className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">Correo *</span>
                <input
                  type="email"
                  className="w-full rounded-lg sm:rounded-xl border-2 border-blue-200 bg-white/90 px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-gray-900 placeholder-gray-500 outline-none transition-all duration-300 focus:border-yellow-500 focus:ring-2 sm:focus:ring-4 focus:ring-yellow-100 focus:bg-white"
                  placeholder="asesor@ejemplo.com"
                  value={basic.email || ""}
                  onChange={(e) => setBasic((b) => ({ ...b, email: e.target.value }))}
                />
              </label>
            </div>
          </div>

          {/* Categorías */}
          <div className="rounded-lg sm:rounded-xl border-2 border-yellow-200 bg-yellow-50/30 p-4 sm:p-6 mb-4 sm:mb-6">
            <h4 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"/>
              </svg>
              Categorías
            </h4>
            <div className="grid grid-cols-1 gap-2 sm:gap-3 lg:grid-cols-2">
              {catalog.categories.map((c) => {
                const active = selectedSet.has(c.id as CategoryId);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCategory(c.id as CategoryId)}
                    className={`w-full rounded-lg sm:rounded-xl border-2 p-3 sm:p-4 text-left transition-all duration-200 ${
                      active 
                        ? "border-yellow-500 bg-gradient-to-r from-yellow-100 to-yellow-200 shadow-lg transform scale-105" 
                        : "border-blue-200 bg-white hover:border-yellow-400 hover:shadow-md"
                    }`}
                  >
                    <div className={`text-sm sm:text-base font-semibold ${active ? "text-yellow-800" : "text-gray-900"}`}>{c.name}</div>
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
              <div key={`svc_${cid}`} className="mb-3 sm:mb-4 rounded-lg sm:rounded-xl border-2 border-blue-200 bg-blue-50/30 p-3 sm:p-4">
                <div className="mb-2 sm:mb-3 text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm sm:text-base">Servicios en {catalog.categories.find((c) => c.id === cid)?.name ?? cid}</span>
                </div>
                <div className="grid gap-2 sm:gap-3 lg:grid-cols-2">
                  {svcs.map((s) => {
                    const ref = { categoryId: cid, id: s.id };
                    const key = `${cid}__${s.id}`;
                    const on = services.some((p) => `${p.categoryId}__${p.id}` === key);
                    return (
                      <label
                        key={key}
                        className={`flex cursor-pointer items-center justify-between rounded-lg border-2 px-3 sm:px-4 py-2.5 sm:py-3 transition-all duration-200 ${
                          on 
                            ? "border-yellow-500 bg-gradient-to-r from-yellow-100 to-yellow-200 shadow-md" 
                            : "border-blue-200 bg-white hover:border-yellow-400 hover:shadow-sm"
                        }`}
                      >
                        <span className={`text-xs sm:text-sm font-medium ${on ? "text-yellow-800" : "text-gray-900"}`}>{s.name}</span>
                        <input
                          type="checkbox"
                          className="h-3.5 w-3.5 sm:h-4 sm:w-4 accent-yellow-600"
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

        <div className="flex-shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 border-t border-gray-200 px-4 sm:px-8 py-4 sm:py-6 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg sm:rounded-xl transition-all duration-200 text-sm sm:text-base"
          >
            Cancelar
          </button>
          <button
            onClick={() => setAskConfirm(true)}
            className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-yellow-500 hover:from-blue-700 hover:to-yellow-600 text-white font-medium rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base"
          >
            Guardar Cambios
          </button>
        </div>
      </div>

      {/* confirmación */}
      {askConfirm && (
        <div 
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setAskConfirm(false);
          }}
        >
          <div className="w-full max-w-sm sm:max-w-md bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
            {/* Header */}
            <div className="h-12 sm:h-16 bg-gradient-to-r from-yellow-500 to-blue-600 relative">
              <div className="absolute inset-0 bg-black/10"></div>
            </div>
            
            {/* Content */}
            <div className="px-4 sm:px-6 py-4 sm:py-6 -mt-2 sm:-mt-4 relative text-center">
              {/* Ícono */}
              <div className="flex justify-center mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full shadow-xl border-4 border-white flex items-center justify-center">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              
              <h4 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Confirmar edición</h4>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">¿Deseas guardar los cambios realizados?</p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3">
                <button
                  onClick={() => setAskConfirm(false)}
                  className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg sm:rounded-xl transition-all duration-200 text-sm sm:text-base"
                >
                  Volver
                </button>
                <button
                  onClick={async () => {
                    try {
                      const dataToSave = { id: advisor.id, basic, categories, services };
                      await onSave(dataToSave);
                      setAskConfirm(false);
                      onClose();
                    } catch (error) {
                      console.error("Error guardando cambios:", error);
                    }
                  }}
                  className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-yellow-500 hover:from-blue-700 hover:to-yellow-600 text-white font-medium rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
