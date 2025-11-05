import React, { useEffect, useState } from "react";
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
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden transform animate-in zoom-in-95 duration-200">
        {/* Header con gradiente */}
        <div className="h-20 bg-gradient-to-r from-blue-600 via-blue-700 to-yellow-500 relative">
          <div className="absolute inset-0 bg-black/10"></div>
          <button
            className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-all duration-200"
            onClick={onClose}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contenido del modal */}
        <div className="px-6 py-6 -mt-6 relative">
          {/* Ícono del modal */}
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full shadow-xl border-4 border-white flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </div>
          </div>

          <h3 className="text-2xl font-bold text-gray-900 text-center mb-6">{id ? "Editar Sala" : "Crear Sala"}</h3>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (id) await onUpdate(id, values);
              else await onCreate(values);
            }}
            className="space-y-5"
          >
            <label className="block">
              <span className="block text-sm font-semibold text-gray-700 mb-2">Nombre de la sala</span>
              <input
                required
                value={values.name}
                onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
                className="w-full rounded-xl border-2 border-blue-200 bg-white/90 px-4 py-3 text-gray-900 placeholder-gray-500 outline-none transition-all duration-300 focus:border-yellow-500 focus:ring-4 focus:ring-yellow-100 focus:bg-white"
                placeholder="Ingresa el nombre de la sala"
              />
            </label>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <label className="block">
                <span className="block text-sm font-semibold text-gray-700 mb-2">Edificio</span>
                <select
                  required
                  value={values.buildingId}
                  onChange={(e) => setValues((v) => ({ ...v, buildingId: e.target.value }))}
                  className="w-full rounded-xl border-2 border-blue-200 bg-white/90 px-4 py-3 text-gray-900 outline-none transition-all duration-300 focus:border-yellow-500 focus:ring-4 focus:ring-yellow-100 focus:bg-white"
                >
                  <option value="">Seleccionar edificio</option>
                  {buildings.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="block text-sm font-semibold text-gray-700 mb-2">N° de sala</span>
                <input
                  required
                  value={values.number}
                  onChange={(e) => setValues((v) => ({ ...v, number: e.target.value }))}
                  className="w-full rounded-xl border-2 border-blue-200 bg-white/90 px-4 py-3 text-gray-900 placeholder-gray-500 outline-none transition-all duration-300 focus:border-yellow-500 focus:ring-4 focus:ring-yellow-100 focus:bg-white"
                  placeholder="101"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <label className="block">
                <span className="block text-sm font-semibold text-gray-700 mb-2">Tipo</span>
                <select
                  required
                  value={values.type}
                  onChange={(e) => setValues((v) => ({ ...v, type: e.target.value as Values["type"] }))}
                  className="w-full rounded-xl border-2 border-blue-200 bg-white/90 px-4 py-3 text-gray-900 outline-none transition-all duration-300 focus:border-yellow-500 focus:ring-4 focus:ring-yellow-100 focus:bg-white"
                >
                  <option value="aula">Aula</option>
                  <option value="laboratorio">Laboratorio</option>
                  <option value="auditorio">Auditorio</option>
                  <option value="sala_reuniones">Sala de Reuniones</option>
                  <option value="oficina">Oficina</option>
                  <option value="sala_virtual">Sala Virtual</option>
                </select>
              </label>

              <label className="block">
                <span className="block text-sm font-semibold text-gray-700 mb-2">Capacidad</span>
                <input
                  required
                  type="number"
                  min={1}
                  value={values.capacity}
                  onChange={(e) => setValues((v) => ({ ...v, capacity: parseInt(e.target.value || "0", 10) || 1 }))}
                  className="w-full rounded-xl border-2 border-blue-200 bg-white/90 px-4 py-3 text-gray-900 outline-none transition-all duration-300 focus:border-yellow-500 focus:ring-4 focus:ring-yellow-100 focus:bg-white"
                  placeholder="20"
                />
              </label>
            </div>

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
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-yellow-500 hover:from-blue-700 hover:to-yellow-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {id ? "Guardar cambios" : "Crear sala"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
