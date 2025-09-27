import React, { useEffect, useState } from "react";
import BaseModal from "./BaseModal";
import { AdminLocationHttpRepo } from "@/infrastructure/admin-location/AdminLocationHttpRepo";
import type { Room } from "@/domain/adminLocation";

type Values = {
  name: string;
  buildingId: string;
  number: string;
  type: Room["type"];
  capacity: number;
};

export default function RoomModal({
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
  const [values, setValues] = useState<Values>({
    name: "",
    buildingId: "",
    number: "",
    type: "aula",
    capacity: 20,
  });

  const [buildings, setBuildings] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const repo = new AdminLocationHttpRepo();
      const bs = await repo.listBuildings();
      if (alive) setBuildings(bs.map((b) => ({ id: b.id, name: b.name })));

      if (id) {
        setLoading(true);
        try {
          const all = await repo.listRooms();
          const found = all.find((r) => r.id === id);
          if (found && alive) {
            setValues({
              name: found.name,
              buildingId: found.buildingId,
              number: found.number || "",
              type: found.type || "aula",
              capacity: found.capacity || 20,
            });
          }
        } finally {
          if (alive) setLoading(false);
        }
      }
    })();
    return () => { alive = false; };
  }, [id]);

  return (
    <BaseModal title={id ? "Editar Sala" : "Crear Sala"} onClose={onClose}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (id) await onUpdate(id, values);
          else await onCreate(values);
        }}
        className="space-y-4"
      >
        <label className="block text-sm font-semibold text-slate-700">
          <span className="mb-1 block">Nombre de la sala</span>
          <input
            required
            value={values.name}
            onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            className="w-full rounded-xl border-2 border-slate-200 px-4 py-2 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
          />
        </label>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="block text-sm font-semibold text-slate-700">
            <span className="mb-1 block">Edificio</span>
            <select
              required
              value={values.buildingId}
              onChange={(e) => setValues((v) => ({ ...v, buildingId: e.target.value }))}
              className="w-full rounded-xl border-2 border-slate-200 px-4 py-2 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
            >
              <option value="">Seleccionar edificio</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            <span className="mb-1 block">N° de sala</span>
            <input
              required
              value={values.number}
              onChange={(e) => setValues((v) => ({ ...v, number: e.target.value }))}
              className="w-full rounded-xl border-2 border-slate-200 px-4 py-2 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="block text-sm font-semibold text-slate-700">
            <span className="mb-1 block">Tipo</span>
            <select
              required
              value={values.type}
              onChange={(e) => setValues((v) => ({ ...v, type: e.target.value as Values["type"] }))}
              className="w-full rounded-xl border-2 border-slate-200 px-4 py-2 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
            >
              <option value="aula">Aula</option>
              <option value="laboratorio">Laboratorio</option>
              <option value="auditorio">Auditorio</option>
              <option value="sala_reuniones">Sala de Reuniones</option>
            </select>
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            <span className="mb-1 block">Capacidad</span>
            <input
              required
              type="number"
              min={1}
              value={values.capacity}
              onChange={(e) => setValues((v) => ({ ...v, capacity: parseInt(e.target.value || "0", 10) || 1 }))}
              className="w-full rounded-xl border-2 border-slate-200 px-4 py-2 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
            />
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="rounded-full border-2 border-slate-200 px-4 py-2 font-semibold text-slate-600 transition hover:border-blue-600 hover:text-blue-600">
            Cancelar
          </button>
          <button type="submit" disabled={loading}
            className="rounded-full bg-gradient-to-br from-blue-600 to-blue-700 px-4 py-2 font-semibold text-white shadow-[0_4px_15px_rgba(37,99,235,0.3)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(37,99,235,0.4)]">
            {id ? "Guardar cambios" : "Crear sala"}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
