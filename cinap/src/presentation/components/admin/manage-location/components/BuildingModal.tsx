import React, { useEffect, useState } from "react";
import BaseModal from "./BaseModal";
import { AdminLocationHttpRepo } from "@/infrastructure/admin-location/AdminLocationHttpRepo";

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
        <label className="block text-sm font-semibold text-slate-700">
          <span className="mb-1 block">Nombre del edificio</span>
          <input
            required
            value={values.name}
            onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            className="w-full rounded-xl border-2 border-slate-200 px-4 py-2 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
          />
        </label>

        <label className="block text-sm font-semibold text-slate-700">
          <span className="mb-1 block">Campus</span>
          <select
            required
            value={values.campusId}
            onChange={(e) => setValues((v) => ({ ...v, campusId: e.target.value }))}
            className="w-full rounded-xl border-2 border-slate-200 px-4 py-2 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
          >
            <option value="">Seleccionar campus</option>
            {campus.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="rounded-full border-2 border-slate-200 px-4 py-2 font-semibold text-slate-600 transition hover:border-blue-600 hover:text-blue-600">
            Cancelar
          </button>
          <button type="submit" disabled={loading}
            className="rounded-full bg-gradient-to-br from-blue-600 to-blue-700 px-4 py-2 font-semibold text-white shadow-[0_4px_15px_rgba(37,99,235,0.3)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(37,99,235,0.4)]">
            {id ? "Guardar cambios" : "Crear edificio"}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
