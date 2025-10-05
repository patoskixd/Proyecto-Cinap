import React, { useEffect, useState } from "react";
import BaseModal from "./BaseModal";
import { AdminLocationHttpRepo } from "@/infrastructure/admin/location/AdminLocationHttpRepo";

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
        <label className="block text-sm font-medium text-gray-700">
          <span className="mb-2 block">Nombre del campus</span>
          <input
            required
            value={values.name}
            onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          />
        </label>

        <label className="block text-sm font-medium text-gray-700">
          <span className="mb-2 block">Dirección</span>
          <textarea
            required
            rows={3}
            value={values.address}
            onChange={(e) => setValues((v) => ({ ...v, address: e.target.value }))}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          />
        </label>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-300 px-6 py-3 font-medium text-gray-700 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 font-medium text-white shadow-lg hover:shadow-blue-200 transition-all duration-200 hover:scale-105"
          >
            {id ? "Guardar cambios" : "Crear campus"}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
