import React, { useEffect, useState } from "react";
import { AdminLocationHttpRepo } from "@/infrastructure/admin/location/AdminLocationHttpRepo";

type Values = { name: string; campusId: string; code: string };

export default function BuildingModal({
  id,
  onClose,
  onCreate,
  onUpdate,
}: {
  id?: string;
  onClose: () => void;
  onCreate: (payload: Values) => Promise<void> | void;
  onUpdate: (id: string, patch: Partial<Values>) => Promise<void> | void;
}) {
  const [values, setValues] = useState<Values>({ name: "", campusId: "", code: "" });
  const [campus, setCampus] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const repo = new AdminLocationHttpRepo();
      const cs = await repo.listCampus();
      if (alive) setCampus(cs.map((c) => ({ id: c.id, name: c.name })));

      if (id) {
        setLoading(true);
        try {
          const all = await repo.listBuildings();
          const found = all.find((b) => b.id === id);
          if (found && alive) setValues({ name: found.name, campusId: found.campusId, code: found.code || "" });
        } finally {
          if (alive) setLoading(false);
        }
      }
    })();
    return () => { alive = false; };
  }, [id]);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-xl bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 overflow-hidden transform animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200 py-4 sm:py-5">
          <div className="flex items-center justify-between px-6">
            <div>
              <h3 className="text-lg font-bold text-blue-900 sm:text-xl">{id ? "Editar Edificio" : "Crear Edificio"}</h3>
              <p className="text-xs text-blue-700 sm:text-sm">{id ? "Modifica los datos del edificio" : "Registra un nuevo edificio"}</p>
            </div>
            <button
              className="hover:bg-blue-200/50 text-blue-700 rounded-full p-2 transition-colors"
              onClick={onClose}
              aria-label="Cerrar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Contenido del modal */}
        <div className="px-6 py-6 relative">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (id) await onUpdate(id, values);
              else await onCreate(values);
            }}
            className="space-y-5"
          >
            <label className="block">
              <span className="block text-sm font-semibold text-gray-700 mb-2">Nombre del edificio</span>
              <input
                required
                value={values.name}
                onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
                className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Ingresa el nombre del edificio"
              />
            </label>
      
            <label className="block">
              <span className="block text-sm font-semibold text-gray-700 mb-2">Código</span>
              <input
                required
                value={values.code}
                onChange={(e) => setValues((v) => ({ ...v, code: e.target.value }))}
                placeholder="CAMP-TEMUCO"
                className="w-full uppercase tracking-wide rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <label className="block">
              <span className="block text-sm font-semibold text-gray-700 mb-2">Campus</span>
              <select
                required
                value={values.campusId}
                onChange={(e) => setValues((v) => ({ ...v, campusId: e.target.value }))}
                className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Seleccionar campus</option>
                {campus.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>

            <div className="flex items-center justify-end gap-3 mt-8">
              <button 
                type="button" 
                onClick={onClose}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all duration-200"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {id ? "Guardar cambios" : "Crear edificio"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
