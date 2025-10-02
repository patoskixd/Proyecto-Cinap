"use client";
import { useEffect, useMemo, useState } from "react";
import type { Resource } from "@domain/slots";

type Props = {
  resources: Resource[];
  recursoId?: string;
  setRecursoId(id?: string): void;
  roomNotes: string;
  setRoomNotes(v: string): void;
};

export default function Step2Place({
  resources,
  recursoId,
  setRecursoId,
  roomNotes,
  setRoomNotes,
}: Props) {

  const [campusId, setCampusId] = useState<string>("");
  const [buildingId, setBuildingId] = useState<string>("");


  const campuses = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    for (const r of resources) map.set(r.campusId, { id: r.campusId, name: r.campus });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [resources]);

  const buildings = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    for (const r of resources) {
      if (!campusId || r.campusId === campusId) map.set(r.buildingId, { id: r.buildingId, name: r.building });
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [resources, campusId]);

  const rooms = useMemo(() => {
    return resources
      .filter((r) => (!campusId || r.campusId === campusId) && (!buildingId || r.buildingId === buildingId))
      .sort((a, b) => (a.alias + (a.number ?? "")).localeCompare(b.alias + (b.number ?? "")));
  }, [resources, campusId, buildingId]);


  useEffect(() => {
    if (!recursoId) return;
    const r = resources.find((x) => x.id === recursoId);
    if (r) {
      setCampusId(r.campusId);
      setBuildingId(r.buildingId);
    }
  }, [recursoId, resources]);

  useEffect(() => {
    setBuildingId("");
    setRecursoId(undefined);
  }, [campusId]); 


  useEffect(() => {
    setRecursoId(undefined);
  }, [buildingId]); 

  return (
    <div className="space-y-8 p-6 md:p-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-blue-900">Lugar de atención</h2>
        <p className="text-blue-700">Primero selecciona el campus, luego el edificio y finalmente la sala.</p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="mb-1 block text-sm font-medium text-blue-900">Campus</label>
          <select
            value={campusId}
            onChange={(e) => setCampusId(e.target.value)}
            className="w-full rounded-lg border-2 border-blue-300 bg-white p-3 text-blue-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
          >
            <option value="">Selecciona un campus…</option>
            {campuses.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-blue-900">Edificio</label>
          <select
            value={buildingId}
            onChange={(e) => setBuildingId(e.target.value)}
            disabled={!campusId}
            className="w-full rounded-lg border-2 border-blue-300 bg-white p-3 text-blue-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:opacity-50 transition"
          >
            <option value="">{campusId ? "Selecciona un edificio…" : "Primero elige un campus"}</option>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-blue-900">Sala</label>
          <select
            value={recursoId ?? ""}
            onChange={(e) => setRecursoId(e.target.value || undefined)}
            disabled={!buildingId}
            className="w-full rounded-lg border-2 border-blue-300 bg-white p-3 text-blue-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:opacity-50 transition"
          >
            <option value="">{buildingId ? "Selecciona una sala…" : "Primero elige un edificio"}</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.alias}{r.number ? `  ${r.number}` : ""} 
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-blue-600">Requerido para asociar el cupo a una sala específica.</p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-blue-900">Notas (opcional)</label>
          <textarea
            value={roomNotes}
            onChange={(e) => setRoomNotes(e.target.value)}
            className="h-28 w-full rounded-lg border-2 border-blue-300 bg-white p-3 text-blue-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
            placeholder="Instrucciones especiales, referencias para encontrar la sala, etc."
          />
        </div>
      </div>
    </div>
  );
}
