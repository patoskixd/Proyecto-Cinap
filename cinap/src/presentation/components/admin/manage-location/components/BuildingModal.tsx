import React, { useEffect, useState } from "react";
import BaseModal from "./BaseModal";
import { AdminLocationHttpRepo } from "@/infrastructure/admin/location/AdminLocationHttpRepo";

type Values = { name: string; campusId: string };

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
  const [values, setValues] = useState<Values>({ name: "", campusId: "" });
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
          if (found && alive) setValues({ name: found.name, campusId: found.campusId });
        } finally {
          if (alive) setLoading(false);
        }
      }
    })();
    return () => { alive = false; };
  }, [id]);

  return (
    <BaseModal title={id ? "Editar Edificio" : "Crear Edificio"} onClose={onClose}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (id) await onUpdate(id, values);
          else await onCreate(values);
        }}
        className="space-y-4"
      >
        <label className="block text-sm font-medium text-gray-700">
          <span className="mb-2 block">Nombre del edificio</span>
          <input
            required
            value={values.name}
            onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          />
        </label>

        <label className="block text-sm font-medium text-gray-700">
          <span className="mb-2 block">Campus</span>
          <select
            required
            value={values.campusId}
            onChange={(e) => setValues((v) => ({ ...v, campusId: e.target.value }))}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          >
            <option value="">Seleccionar campus</option>
            {campus.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>

        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={onClose}
            className="rounded-xl border border-gray-300 px-6 py-3 font-medium text-gray-700 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200">
            Cancelar
          </button>
          <button type="submit" disabled={loading}
            className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 font-medium text-white shadow-lg hover:shadow-blue-200 transition-all duration-200 hover:scale-105">
            {id ? "Guardar cambios" : "Crear edificio"}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
