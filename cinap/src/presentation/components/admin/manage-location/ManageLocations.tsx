"use client";

import React, { useState } from "react";
import useLocationState from "./hooks/useLocationState";

import Stats from "./components/Stats";
import Toast, { notify } from "./components/Toast";
import CampusModal from "./components/CampusModal";
import BuildingModal from "./components/BuildingModal";
import RoomModal from "./components/RoomModal";
import ConfirmModal from "./components/ConfirmModal";
import type { Room } from "@/domain/adminLocation";

type Tab = "campus" | "buildings" | "rooms";

export default function ManageLocations() {
  const {
    loading, stats, parseError,
    // campus
    campusFiltered, campusQuery, setCampusQuery,
    createCampus, updateCampus, reactivateCampus, deactivateCampus, deleteCampus,
    // buildings
    buildingsFiltered, buildingsQuery, setBuildingsQuery,
    createBuilding, updateBuilding, reactivateBuilding, deactivateBuilding, deleteBuilding,
    // rooms
    roomsFiltered, roomsQuery, setRoomsQuery,
    createRoom, updateRoom, reactivateRoom, deactivateRoom, deleteRoom,
  } = useLocationState();

  const [tab, setTab] = useState<Tab>("campus");


  const [campusOpen, setCampusOpen] = useState<{ open: boolean; id?: string } | null>(null);
  const [buildingOpen, setBuildingOpen] = useState<{ open: boolean; id?: string; campusId?: string } | null>(null);
  const [roomOpen, setRoomOpen] = useState<{ open: boolean; id?: string; buildingId?: string } | null>(null);


  const [confirm, setConfirm] = useState<
    | { kind: "campus"; id: string; name: string }
    | { kind: "building"; id: string; name: string }
    | { kind: "room"; id: string; name: string }
    | null
  >(null);

  const emptyCell = (v?: string | number) => (v ?? "—");

  return (
    <div className="min-h-screen text-slate-900">
      <main className="mx-auto mt-6 max-w-[1400px] px-6 pb-24">
        <section className="mb-6 rounded-2xl bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.06)] ring-1 ring-slate-100 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">Gestión de Ubicaciones</h1>
              <p className="mt-1 text-neutral-600">Administra campus, edificios y salas del sistema.</p>
            </div>
            <div className="flex gap-2">
              <button
                className={`rounded-full px-4 py-2 font-semibold ${tab === "campus" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"}`}
                onClick={() => setTab("campus")}
              >
                🏛️ Campus
              </button>
              <button
                className={`rounded-full px-4 py-2 font-semibold ${tab === "buildings" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"}`}
                onClick={() => setTab("buildings")}
              >
                🏢 Edificios
              </button>
              <button
                className={`rounded-full px-4 py-2 font-semibold ${tab === "rooms" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"}`}
                onClick={() => setTab("rooms")}
              >
                🚪 Salas
              </button>
            </div>
          </div>
        </section>

        <Stats
          totalCampus={stats.totalCampus}
          totalBuildings={stats.totalBuildings}
          totalRooms={stats.totalRooms}
          totalCapacity={stats.totalCapacity}
        />

        {/* ====== CAMPUS ====== */}
        {tab === "campus" && (
          <section className="overflow-hidden rounded-2xl bg-white shadow-[0_10px_30px_rgba(0,0,0,0.06)] ring-1 ring-slate-100">
            <div className="border-b border-slate-100 px-5 py-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900">Campus</h2>
                  <p className="mt-0.5 text-sm text-neutral-600">Crea, edita y gestiona los campus.</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    value={campusQuery}
                    onChange={(e) => setCampusQuery(e.target.value)}
                    placeholder="Buscar por nombre o dirección…"
                    className="w-64 rounded-xl border-2 border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                  />
                  <button
                    onClick={() => setCampusOpen({ open: true })}
                    className="rounded-full bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
                  >
                    ➕ Crear Campus
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="p-8 text-center text-neutral-500">Cargando…</div>
            ) : (
              <div className="p-5">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-left text-sm">
                        <th className="px-3 py-2">Nombre</th>
                        <th className="px-3 py-2">Dirección</th>
                        <th className="px-3 py-2">Estado</th>
                        <th className="px-3 py-2 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {campusFiltered.map((c) => (
                        <tr key={c.id} className="border-t">
                          <td className="px-3 py-2 font-medium">{c.name}</td>
                          <td className="px-3 py-2">{emptyCell(c.address)}</td>
                          <td className="px-3 py-2">
                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${c.active ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-600 border border-slate-200"}`}>
                              {c.active ? "Activo" : "No activo"}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex justify-end gap-2">
                              <button
                                title="Editar"
                                className="rounded-md p-2 hover:bg-slate-100"
                                onClick={() => setCampusOpen({ open: true, id: c.id })}
                              >
                                ✏️
                              </button>
                              <button
                                title={c.active ? "Desactivar" : "Activar"}
                                className="rounded-md p-2 hover:bg-slate-100"
                                onClick={async () => {
                                  try {
                                    if (c.active) await deactivateCampus(c.id);
                                    else await reactivateCampus(c.id);
                                    notify("Estado actualizado");
                                  } catch (e) { notify(parseError(e)); }
                                }}
                              >
                                {c.active ? "❌" : "✅"}
                              </button>
                              <button
                                title="Eliminar"
                                className="rounded-md p-2 hover:bg-slate-100"
                                onClick={() => setConfirm({ kind: "campus", id: c.id, name: c.name })}
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {campusFiltered.length === 0 && (
                        <tr><td colSpan={4} className="px-3 py-10 text-center text-neutral-500">Sin resultados</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ====== BUILDINGS ====== */}
        {tab === "buildings" && (
          <section className="overflow-hidden rounded-2xl bg-white shadow-[0_10px_30px_rgba(0,0,0,0.06)] ring-1 ring-slate-100">
            <div className="border-b border-slate-100 px-5 py-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900">Edificios</h2>
                  <p className="mt-0.5 text-sm text-neutral-600">Gestiona los edificios y su campus.</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    value={buildingsQuery}
                    onChange={(e) => setBuildingsQuery(e.target.value)}
                    placeholder="Buscar por nombre o campus…"
                    className="w-64 rounded-xl border-2 border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                  />
                  <button
                    onClick={() => setBuildingOpen({ open: true })}
                    className="rounded-full bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
                  >
                    ➕ Crear Edificio
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="p-8 text-center text-neutral-500">Cargando…</div>
            ) : (
              <div className="p-5">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-left text-sm">
                        <th className="px-3 py-2">Nombre</th>
                        <th className="px-3 py-2">Campus</th>
                        <th className="px-3 py-2">Estado</th>
                        <th className="px-3 py-2 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {buildingsFiltered.map((b) => (
                        <tr key={b.id} className="border-t">
                          <td className="px-3 py-2 font-medium">{b.name}</td>
                          <td className="px-3 py-2">{emptyCell(b.campusName)}</td>
                          <td className="px-3 py-2">
                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${b.active ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-600 border border-slate-200"}`}>
                              {b.active ? "Activo" : "No activo"}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex justify-end gap-2">
                              <button
                                title="Editar"
                                className="rounded-md p-2 hover:bg-slate-100"
                                onClick={() => setBuildingOpen({ open: true, id: b.id, campusId: b.campusId })}
                              >
                                ✏️
                              </button>
                              <button
                                title={b.active ? "Desactivar" : "Activar"}
                                className="rounded-md p-2 hover:bg-slate-100"
                                onClick={async () => {
                                  try {
                                    if (b.active) await deactivateBuilding(b.id);
                                    else await reactivateBuilding(b.id);
                                    notify("Estado actualizado");
                                  } catch (e) { notify(parseError(e)); }
                                }}
                              >
                                {b.active ? "❌" : "✅"}
                              </button>
                              <button
                                title="Eliminar"
                                className="rounded-md p-2 hover:bg-slate-100"
                                onClick={() => setConfirm({ kind: "building", id: b.id, name: b.name })}
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {buildingsFiltered.length === 0 && (
                        <tr><td colSpan={4} className="px-3 py-10 text-center text-neutral-500">Sin resultados</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ====== ROOMS ====== */}
        {tab === "rooms" && (
          <section className="overflow-hidden rounded-2xl bg-white shadow-[0_10px_30px_rgba(0,0,0,0.06)] ring-1 ring-slate-100">
            <div className="border-b border-slate-100 px-5 py-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900">Salas</h2>
                  <p className="mt-0.5 text-sm text-neutral-600">Gestiona salas, su capacidad y tipo.</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    value={roomsQuery}
                    onChange={(e) => setRoomsQuery(e.target.value)}
                    placeholder="Buscar por nombre, edificio o número…"
                    className="w-72 rounded-xl border-2 border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                  />
                  <button
                    onClick={() => setRoomOpen({ open: true })}
                    className="rounded-full bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
                  >
                    ➕ Crear Sala
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="p-8 text-center text-neutral-500">Cargando…</div>
            ) : (
              <div className="p-5">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-left text-sm">
                        <th className="px-3 py-2">Nombre</th>
                        <th className="px-3 py-2">Edificio</th>
                        <th className="px-3 py-2">N°</th>
                        <th className="px-3 py-2">Tipo</th>
                        <th className="px-3 py-2">Capacidad</th>
                        <th className="px-3 py-2">Estado</th>
                        <th className="px-3 py-2 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roomsFiltered.map((r) => (
                        <tr key={r.id} className="border-t">
                          <td className="px-3 py-2 font-medium">{r.name}</td>
                          <td className="px-3 py-2">{emptyCell(r.buildingName)}</td>
                          <td className="px-3 py-2">{emptyCell(r.number)}</td>
                          <td className="px-3 py-2 capitalize">{(r.type || "").replace("_", " ")}</td>
                          <td className="px-3 py-2">{r.capacity ?? "—"}</td>
                          <td className="px-3 py-2">
                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${r.active ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-600 border border-slate-200"}`}>
                              {r.active ? "Activo" : "No activo"}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex justify-end gap-2">
                              <button
                                title="Editar"
                                className="rounded-md p-2 hover:bg-slate-100"
                                onClick={() => setRoomOpen({ open: true, id: r.id, buildingId: r.buildingId })}
                              >
                                ✏️
                              </button>
                              <button
                                title={r.active ? "Desactivar" : "Activar"}
                                className="rounded-md p-2 hover:bg-slate-100"
                                onClick={async () => {
                                  try {
                                    if (r.active) await deactivateRoom(r.id);
                                    else await reactivateRoom(r.id);
                                    notify("Estado actualizado");
                                  } catch (e) { notify(parseError(e)); }
                                }}
                              >
                                {r.active ? "❌" : "✅"}
                              </button>
                              <button
                                title="Eliminar"
                                className="rounded-md p-2 hover:bg-slate-100"
                                onClick={() => setConfirm({ kind: "room", id: r.id, name: r.name })}
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {roomsFiltered.length === 0 && (
                        <tr><td colSpan={7} className="px-3 py-10 text-center text-neutral-500">Sin resultados</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      {/* ===== Modales ===== */}
      {campusOpen?.open && (
        <CampusModal
          id={campusOpen.id}
          onClose={() => setCampusOpen(null)}
          onCreate={async (payload) => {
            try { await createCampus(payload); notify("Campus creado"); setCampusOpen(null); }
            catch (e) { notify(parseError(e)); }
          }}
          onUpdate={async (id, patch) => {
            try { await updateCampus(id, patch); notify("Campus actualizado"); setCampusOpen(null); }
            catch (e) { notify(parseError(e)); }
          }}
        />
      )}

      {buildingOpen?.open && (
        <BuildingModal
          id={buildingOpen.id}
          onClose={() => setBuildingOpen(null)}
          onCreate={async (payload) => {
            try { await createBuilding(payload); notify("Edificio creado"); setBuildingOpen(null); }
            catch (e) { notify(parseError(e)); }
          }}
          onUpdate={async (id, patch) => {
            try { await updateBuilding(id, patch); notify("Edificio actualizado"); setBuildingOpen(null); }
            catch (e) { notify(parseError(e)); }
          }}
        />
      )}

      {roomOpen?.open && (
        <RoomModal
          id={roomOpen.id}
          onClose={() => setRoomOpen(null)}
          onCreate={async (payload) => {
            try {
              await createRoom(payload as Required<Parameters<typeof createRoom>[0]>);
              notify("Sala creada");
              setRoomOpen(null);
            } catch (e) { notify(parseError(e)); }
          }}
          onUpdate={async (id, patch) => {
            try {
              await updateRoom(id, patch as Partial<Room>);
              notify("Sala actualizada");
              setRoomOpen(null);
            } catch (e) { notify(parseError(e)); }
          }}
        />
      )}

      {confirm && (
        <ConfirmModal
          kind={confirm.kind}
          name={confirm.name}
          onCancel={() => setConfirm(null)}
          onConfirm={async () => {
            try {
              if (confirm.kind === "campus")      await deleteCampus(confirm.id);
              else if (confirm.kind === "building") await deleteBuilding(confirm.id);
              else                                  await deleteRoom(confirm.id);
              notify("Eliminado correctamente");
              setConfirm(null);
            } catch (e) { notify(parseError(e)); }
          }}
        />
      )}

      <Toast />
    </div>
  );
}
