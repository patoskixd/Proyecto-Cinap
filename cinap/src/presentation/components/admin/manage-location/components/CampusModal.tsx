import React, { useEffect, useState } from "react";
import BaseModal from "./BaseModal";
import { AdminLocationHttpRepo } from "@/infrastructure/admin-location/AdminLocationHttpRepo";

type Values = { name: string; address: string };

export default function CampusModal({
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
  const [values, setValues] = useState<Values>({ name: "", address: "" });
  const [loading, setLoading] = useState(false);

  // precargar si viene id
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!id) return;
      setLoading(true);
      try {
        // pequeña lectura desde repo (si no tienes endpoint de detalle puedes pasarlo desde la lista)
        const repo = new AdminLocationHttpRepo();
        const all = await repo.listCampus();
        const found = all.find((c) => c.id === id);
        if (found && alive) setValues({ name: found.name, address: found.address || "" });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  return (
    <BaseModal title={id ? "Editar Campus" : "Crear Campus"} onClose={onClose}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (id) await onUpdate(id, values);
          else await onCreate(values);
        }}
        className="space-y-4"
      >
        <label className="block text-sm font-semibold text-slate-700">
          <span className="mb-1 block">Nombre del campus</span>
          <input
            required
            value={values.name}
            onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            className="w-full rounded-xl border-2 border-slate-200 px-4 py-2 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
          />
        </label>

        <label className="block text-sm font-semibold text-slate-700">
          <span className="mb-1 block">Dirección</span>
          <textarea
            required
            rows={3}
            value={values.address}
            onChange={(e) => setValues((v) => ({ ...v, address: e.target.value }))}
            className="w-full rounded-xl border-2 border-slate-200 px-4 py-2 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
          />
        </label>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border-2 border-slate-200 px-4 py-2 font-semibold text-slate-600 transition hover:border-blue-600 hover:text-blue-600"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-gradient-to-br from-blue-600 to-blue-700 px-4 py-2 font-semibold text-white shadow-[0_4px_15px_rgba(37,99,235,0.3)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(37,99,235,0.4)]"
          >
            {id ? "Guardar cambios" : "Crear campus"}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
