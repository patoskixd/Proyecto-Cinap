import React, { useEffect, useState } from "react";
import BaseModal from "./BaseModal";
import { AdminLocationHttpRepo } from "@/infrastructure/admin/location/AdminLocationHttpRepo";
import type { Room } from "@/domain/admin/location";

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
        <label className="block text-sm font-medium text-gray-700">
          <span className="mb-2 block">Nombre de la sala</span>
          <input
            required
            value={values.name}
            onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          />
        </label>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="block text-sm font-medium text-gray-700">
            <span className="mb-2 block">Edificio</span>
            <select
              required
              value={values.buildingId}
              onChange={(e) => setValues((v) => ({ ...v, buildingId: e.target.value }))}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            >
              <option value="">Seleccionar edificio</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-gray-700">
            <span className="mb-2 block">N° de sala</span>
            <input
              required
              value={values.number}
              onChange={(e) => setValues((v) => ({ ...v, number: e.target.value }))}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="block text-sm font-medium text-gray-700">
            <span className="mb-2 block">Tipo</span>
            <select
              required
              value={values.type}
              onChange={(e) => setValues((v) => ({ ...v, type: e.target.value as Values["type"] }))}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            >
              <option value="aula">Aula</option>
              <option value="laboratorio">Laboratorio</option>
              <option value="auditorio">Auditorio</option>
              <option value="sala_reuniones">Sala de Reuniones</option>
              <option value="oficina">Oficina</option>
              <option value="sala_virtual">Sala Virtual</option>
            </select>
          </label>

          <label className="block text-sm font-medium text-gray-700">
            <span className="mb-2 block">Capacidad</span>
            <input
              required
              type="number"
              min={1}
              value={values.capacity}
              onChange={(e) => setValues((v) => ({ ...v, capacity: parseInt(e.target.value || "0", 10) || 1 }))}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={onClose}
            className="rounded-xl border border-gray-300 px-6 py-3 font-medium text-gray-700 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200">
            Cancelar
          </button>
          <button type="submit" disabled={loading}
            className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 font-medium text-white shadow-lg hover:shadow-blue-200 transition-all duration-200 hover:scale-105">
            {id ? "Guardar cambios" : "Crear sala"}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
