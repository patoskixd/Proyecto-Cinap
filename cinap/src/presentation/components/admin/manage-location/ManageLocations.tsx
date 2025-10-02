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
    <div className="min-h-screen ">
      <main className="mx-auto mt-6 max-w-[1400px] px-6 pb-24">
        <div className="mb-6 rounded-2xl border border-blue-200 bg-gradient-to-br from-white via-blue-50/30 to-yellow-50/20 p-6 shadow-lg backdrop-blur-sm md:mb-8 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-blue-900">
                Gestión de Ubicaciones
              </h1>
              <p className="mt-1 text-blue-700">Administra campus, edificios y salas del sistema.</p>
            </div>
            <div className="flex gap-2">
              <button
                className={`rounded-xl px-5 py-2.5 font-medium transition-all duration-200 ${
                  tab === "campus" 
                    ? "bg-blue-600 text-white shadow-lg hover:bg-blue-700" 
                    : "bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-700 border border-gray-300"
                }`}
                onClick={() => setTab("campus")}
              >
                Campus
              </button>
              <button
                className={`rounded-xl px-5 py-2.5 font-medium transition-all duration-200 ${
                  tab === "buildings" 
                    ? "bg-blue-600 text-white shadow-lg hover:bg-blue-700" 
                    : "bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-700 border border-gray-300"
                }`}
                onClick={() => setTab("buildings")}
              >
                Edificios
              </button>
              <button
                className={`rounded-xl px-5 py-2.5 font-medium transition-all duration-200 ${
                  tab === "rooms" 
                    ? "bg-blue-600 text-white shadow-lg hover:bg-blue-700" 
                    : "bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-700 border border-gray-300"
                }`}
                onClick={() => setTab("rooms")}
              >
                Salas
              </button>
            </div>
          </div>
        </div>

        <Stats
          totalCampus={stats.totalCampus}
          totalBuildings={stats.totalBuildings}
          totalRooms={stats.totalRooms}
          totalCapacity={stats.totalCapacity}
        />

        {/* ====== CAMPUS ====== */}
        {tab === "campus" && (
          <section className="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-blue-100">
            <div className="border-b border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-blue-900">Campus</h2>
                  <p className="mt-1 text-sm text-blue-700">Crea, edita y gestiona los campus.</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      value={campusQuery}
                      onChange={(e) => setCampusQuery(e.target.value)}
                      placeholder="Buscar por nombre o dirección…"
                      className="w-72 pl-10 pr-4 py-2.5 rounded-xl bg-white border border-blue-200 text-sm text-gray-900 placeholder-gray-500 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200"
                    />
                  </div>
                  <button
                    onClick={() => setCampusOpen({ open: true })}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 px-5 py-2.5 font-medium text-white shadow-sm hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Crear Campus
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-blue-700 font-medium">Cargando campus...</span>
                </div>
              </div>
            ) : (
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-left text-sm">
                        <th className="px-4 py-3 font-medium text-gray-700">Nombre</th>
                        <th className="px-4 py-3 font-medium text-gray-700">Dirección</th>
                        <th className="px-4 py-3 font-medium text-gray-700">Estado</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-700">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {campusFiltered.map((c) => (
                        <tr key={c.id} className="border-t border-gray-100 hover:bg-blue-50/50 transition-colors duration-200">
                          <td className="px-4 py-4 font-medium text-gray-900">{c.name}</td>
                          <td className="px-4 py-4 text-gray-600">{emptyCell(c.address)}</td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                              c.active 
                                ? "bg-green-100 text-green-700" 
                                : "bg-gray-100 text-gray-600"
                            }`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${c.active ? "bg-green-500" : "bg-gray-400"}`}></div>
                              {c.active ? "Activo" : "No activo"}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex justify-end gap-2">
                              <button
                                title="Editar"
                                className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 transition-colors duration-200"
                                onClick={() => setCampusOpen({ open: true, id: c.id })}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                title={c.active ? "Desactivar" : "Activar"}
                                className={`rounded-lg p-2 transition-colors duration-200 ${
                                  c.active 
                                    ? "text-red-600 hover:bg-red-50" 
                                    : "text-green-600 hover:bg-green-50"
                                }`}
                                onClick={async () => {
                                  try {
                                    if (c.active) await deactivateCampus(c.id);
                                    else await reactivateCampus(c.id);
                                    notify("Estado actualizado");
                                  } catch (e) { notify(parseError(e)); }
                                }}
                              >
                                {c.active ? (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                )}
                              </button>
                              <button
                                title="Eliminar"
                                className="rounded-lg p-2 text-red-600 hover:bg-red-50 transition-colors duration-200"
                                onClick={() => setConfirm({ kind: "campus", id: c.id, name: c.name })}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {campusFiltered.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-4 py-12 text-center">
                            <div className="flex flex-col items-center gap-3">
                              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                              </div>
                              <div className="text-gray-500 font-medium">Sin resultados</div>
                              <div className="text-gray-400 text-sm">No se encontraron campus con los criterios de búsqueda</div>
                            </div>
                          </td>
                        </tr>
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
          <section className="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-blue-100">
            <div className="border-b border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-blue-900">Edificios</h2>
                  <p className="mt-1 text-sm text-blue-700">Gestiona los edificios y su campus.</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      value={buildingsQuery}
                      onChange={(e) => setBuildingsQuery(e.target.value)}
                      placeholder="Buscar por nombre o campus…"
                      className="w-72 pl-10 pr-4 py-2.5 rounded-xl bg-white border border-blue-200 text-sm text-gray-900 placeholder-gray-500 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200"
                    />
                  </div>
                  <button
                    onClick={() => setBuildingOpen({ open: true })}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 px-5 py-2.5 font-medium text-white shadow-sm hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Crear Edificio
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-blue-700 font-medium">Cargando edificios...</span>
                </div>
              </div>
            ) : (
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-left text-sm">
                        <th className="px-4 py-3 font-medium text-gray-700">Nombre</th>
                        <th className="px-4 py-3 font-medium text-gray-700">Campus</th>
                        <th className="px-4 py-3 font-medium text-gray-700">Estado</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-700">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {buildingsFiltered.map((b) => (
                        <tr key={b.id} className="border-t border-gray-100 hover:bg-blue-50/50 transition-colors duration-200">
                          <td className="px-4 py-4 font-medium text-gray-900">{b.name}</td>
                          <td className="px-4 py-4 text-gray-600">{emptyCell(b.campusName)}</td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                              b.active 
                                ? "bg-green-100 text-green-700" 
                                : "bg-gray-100 text-gray-600"
                            }`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${b.active ? "bg-green-500" : "bg-gray-400"}`}></div>
                              {b.active ? "Activo" : "No activo"}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex justify-end gap-2">
                              <button
                                title="Editar"
                                className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 transition-colors duration-200"
                                onClick={() => setBuildingOpen({ open: true, id: b.id, campusId: b.campusId })}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                title={b.active ? "Desactivar" : "Activar"}
                                className={`rounded-lg p-2 transition-colors duration-200 ${
                                  b.active 
                                    ? "text-red-600 hover:bg-red-50" 
                                    : "text-green-600 hover:bg-green-50"
                                }`}
                                onClick={async () => {
                                  try {
                                    if (b.active) await deactivateBuilding(b.id);
                                    else await reactivateBuilding(b.id);
                                    notify("Estado actualizado");
                                  } catch (e) { notify(parseError(e)); }
                                }}
                              >
                                {b.active ? (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                )}
                              </button>
                              <button
                                title="Eliminar"
                                className="rounded-lg p-2 text-red-600 hover:bg-red-50 transition-colors duration-200"
                                onClick={() => setConfirm({ kind: "building", id: b.id, name: b.name })}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {buildingsFiltered.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-4 py-12 text-center">
                            <div className="flex flex-col items-center gap-3">
                              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10v11M20 10v11" />
                                </svg>
                              </div>
                              <div className="text-gray-500 font-medium">Sin resultados</div>
                              <div className="text-gray-400 text-sm">No se encontraron edificios con los criterios de búsqueda</div>
                            </div>
                          </td>
                        </tr>
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
          <section className="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-blue-100">
            <div className="border-b border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-blue-900">Salas</h2>
                  <p className="mt-1 text-sm text-blue-700">Gestiona salas, su capacidad y tipo.</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      value={roomsQuery}
                      onChange={(e) => setRoomsQuery(e.target.value)}
                      placeholder="Buscar por nombre, edificio o número…"
                      className="w-80 pl-10 pr-4 py-2.5 rounded-xl bg-white border border-blue-200 text-sm text-gray-900 placeholder-gray-500 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200"
                    />
                  </div>
                  <button
                    onClick={() => setRoomOpen({ open: true })}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 px-5 py-2.5 font-medium text-white shadow-sm hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Crear Sala
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-blue-700 font-medium">Cargando salas...</span>
                </div>
              </div>
            ) : (
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-left text-sm">
                        <th className="px-4 py-3 font-medium text-gray-700">Nombre</th>
                        <th className="px-4 py-3 font-medium text-gray-700">Edificio</th>
                        <th className="px-4 py-3 font-medium text-gray-700">N°</th>
                        <th className="px-4 py-3 font-medium text-gray-700">Tipo</th>
                        <th className="px-4 py-3 font-medium text-gray-700">Capacidad</th>
                        <th className="px-4 py-3 font-medium text-gray-700">Estado</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-700">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roomsFiltered.map((r) => (
                        <tr key={r.id} className="border-t border-gray-100 hover:bg-blue-50/50 transition-colors duration-200">
                          <td className="px-4 py-4 font-medium text-gray-900">{r.name}</td>
                          <td className="px-4 py-4 text-gray-600">{emptyCell(r.buildingName)}</td>
                          <td className="px-4 py-4 text-gray-600">{emptyCell(r.number)}</td>
                          <td className="px-4 py-4 text-gray-600 capitalize">{(r.type || "").replace("_", " ")}</td>
                          <td className="px-4 py-4 text-gray-600">{r.capacity ?? "—"}</td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                              r.active 
                                ? "bg-green-100 text-green-700" 
                                : "bg-gray-100 text-gray-600"
                            }`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${r.active ? "bg-green-500" : "bg-gray-400"}`}></div>
                              {r.active ? "Activo" : "No activo"}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex justify-end gap-2">
                              <button
                                title="Editar"
                                className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 transition-colors duration-200"
                                onClick={() => setRoomOpen({ open: true, id: r.id, buildingId: r.buildingId })}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                title={r.active ? "Desactivar" : "Activar"}
                                className={`rounded-lg p-2 transition-colors duration-200 ${
                                  r.active 
                                    ? "text-red-600 hover:bg-red-50" 
                                    : "text-green-600 hover:bg-green-50"
                                }`}
                                onClick={async () => {
                                  try {
                                    if (r.active) await deactivateRoom(r.id);
                                    else await reactivateRoom(r.id);
                                    notify("Estado actualizado");
                                  } catch (e) { notify(parseError(e)); }
                                }}
                              >
                                {r.active ? (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                )}
                              </button>
                              <button
                                title="Eliminar"
                                className="rounded-lg p-2 text-red-600 hover:bg-red-50 transition-colors duration-200"
                                onClick={() => setConfirm({ kind: "room", id: r.id, name: r.name })}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {roomsFiltered.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-4 py-12 text-center">
                            <div className="flex flex-col items-center gap-3">
                              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <div className="text-gray-500 font-medium">Sin resultados</div>
                              <div className="text-gray-400 text-sm">No se encontraron salas con los criterios de búsqueda</div>
                            </div>
                          </td>
                        </tr>
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
