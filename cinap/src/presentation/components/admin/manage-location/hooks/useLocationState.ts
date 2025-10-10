"use client";

import { useEffect, useMemo, useState } from "react";
import type { Campus, Building, Room } from "@/domain/admin/location";
import { AdminLocationHttpRepo } from "@/infrastructure/admin/location/AdminLocationHttpRepo";

// Campus 
import ListCampus from "@/application/admin/location/usecases/Campus/ListCampus";
import CreateCampus from "@/application/admin/location/usecases/Campus/CreateCampus";
import UpdateCampus from "@/application/admin/location/usecases/Campus/UpdateCampus";
import ReactivateCampus from "@/application/admin/location/usecases/Campus/ReactivateCampus";
import DeleteCampus from "@/application/admin/location/usecases/Campus/DeleteCampus";

// Buildings 
import ListBuildings from "@/application/admin/location/usecases/Buildings/ListBuidlings";
import CreateBuilding from "@/application/admin/location/usecases/Buildings/CreateBuilding";
import UpdateBuilding from "@/application/admin/location/usecases/Buildings/UpdateBuildings";
import ReactivateBuilding from "@/application/admin/location/usecases/Buildings/ReactivateBuildings";
import DeleteBuilding from "@/application/admin/location/usecases/Buildings/DeleteBuildings";

// Rooms 
import ListRooms from "@/application/admin/location/usecases/Rooms/ListRooms";
import CreateRoom from "@/application/admin/location/usecases/Rooms/CreateRooms";
import UpdateRoom from "@/application/admin/location/usecases/Rooms/UpdateRooms";
import ReactivateRoom from "@/application/admin/location/usecases/Rooms/ReactivateRooms";
import DeleteRoom from "@/application/admin/location/usecases/Rooms/DeleteRooms";

function parseError(e: unknown) {
  const s = (e as any)?.message || "Algo salió mal";
  if (/405/.test(s)) return "Método no permitido en el endpoint (405). Revisa los handlers GET/POST/PATCH/DELETE.";
  if (/404|not\s*found/i.test(s)) return "Recurso no encontrado.";
  if (/unique|duplicad/i.test(s)) return "Ya existe un registro con esos datos.";
  return s;
}

export function useLocationState() {
  const repo = useMemo(() => new AdminLocationHttpRepo(), []);

  // campus
  const ucListCampus = useMemo(() => new ListCampus(repo), [repo]);
  const ucCreateCampus = useMemo(() => new CreateCampus(repo), [repo]);
  const ucUpdateCampus = useMemo(() => new UpdateCampus(repo), [repo]);
  const ucReactivateCampus = useMemo(() => new ReactivateCampus(repo), [repo]);
  const ucDeleteCampus = useMemo(() => new DeleteCampus(repo), [repo]);

  // buildings
  const ucListBuildings = useMemo(() => new ListBuildings(repo), [repo]);
  const ucCreateBuilding = useMemo(() => new CreateBuilding(repo), [repo]);
  const ucUpdateBuilding = useMemo(() => new UpdateBuilding(repo), [repo]);
  const ucReactivateBuilding = useMemo(() => new ReactivateBuilding(repo), [repo]);
  const ucDeleteBuilding = useMemo(() => new DeleteBuilding(repo), [repo]);

  // rooms
  const ucListRooms = useMemo(() => new ListRooms(repo), [repo]);
  const ucCreateRoom = useMemo(() => new CreateRoom(repo), [repo]);
  const ucUpdateRoom = useMemo(() => new UpdateRoom(repo), [repo]);
  const ucReactivateRoom = useMemo(() => new ReactivateRoom(repo), [repo]);
  const ucDeleteRoom = useMemo(() => new DeleteRoom(repo), [repo]);

  const [loading, setLoading] = useState(true);

  const [campus, setCampus] = useState<Campus[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);

  // filtros/búsqueda
  const [campusQuery, setCampusQuery] = useState("");
  const [buildingsQuery, setBuildingsQuery] = useState("");
  const [roomsQuery, setRoomsQuery] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const [c, b, r] = await Promise.all([
          ucListCampus.exec(),
          ucListBuildings.exec(),
          ucListRooms.exec(),
        ]);
        if (!alive) return;
        setCampus(c);
        setBuildings(b);
        setRooms(r);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [ucListCampus, ucListBuildings, ucListRooms]);

  //  stats
  const stats = useMemo(() => {
    const totalCapacity = rooms.reduce((acc, it) => acc + (it.capacity || 0), 0);
    return {
      totalCampus: campus.length,
      totalBuildings: buildings.length,
      totalRooms: rooms.length,
      totalCapacity,
    };
  }, [campus, buildings, rooms]);

  //  filtros
  const campusFiltered = useMemo(() => {
    const q = campusQuery.trim().toLowerCase();
    if (!q) return campus;
    return campus.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.address || "").toLowerCase().includes(q)
    );
  }, [campus, campusQuery]);

  const buildingsFiltered = useMemo(() => {
    const q = buildingsQuery.trim().toLowerCase();
    if (!q) return buildings;
    return buildings.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        (b.campusName || "").toLowerCase().includes(q)
    );
  }, [buildings, buildingsQuery]);

  const roomsFiltered = useMemo(() => {
    const q = roomsQuery.trim().toLowerCase();
    if (!q) return rooms;
    return rooms.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.buildingName || "").toLowerCase().includes(q) ||
        (r.number || "").toLowerCase().includes(q)
    );
  }, [rooms, roomsQuery]);

  //  helpers
  function upsert<T extends { id: string }>(list: T[], item: T) {
    const i = list.findIndex((x) => x.id === item.id);
    if (i === -1) return [item, ...list];
    const copy = [...list];
    copy[i] = item;
    return copy;
  }

  //  acciones campus
  async function createCampus(payload: { name: string; address: string; code: string }) {
    const saved = await ucCreateCampus.exec(payload);
    setCampus((prev) => upsert(prev, saved));
    return saved;
  }
  async function updateCampus(id: string, patch: { name?: string; address?: string; code?: string; active?: boolean }) {
    const saved = await ucUpdateCampus.exec(id, patch);
    setCampus((prev) => upsert(prev, saved));
    return saved;
  }
  async function reactivateCampus(id: string) {
    const saved = await ucReactivateCampus.exec(id);
    setCampus((prev) => upsert(prev, saved));
    return saved;
  }
  async function deactivateCampus(id: string) {
    return updateCampus(id, { active: false });
  }
  async function deleteCampus(id: string) {
    await ucDeleteCampus.exec(id);
    setCampus((prev) => prev.filter((x) => x.id !== id));
  }

  //  acciones buildings
  async function createBuilding(payload: { name: string; campusId: string; code: string }) {
    const saved = await ucCreateBuilding.exec(payload);
    setBuildings((prev) => upsert(prev, saved));
    return saved;
  }
  async function updateBuilding(id: string, patch: { name?: string; campusId?: string; code?: string; active?: boolean }) {
    const saved = await ucUpdateBuilding.exec(id, patch);
    setBuildings((prev) => upsert(prev, saved));
    return saved;
  }
  async function reactivateBuilding(id: string) {
    const saved = await ucReactivateBuilding.exec(id);
    setBuildings((prev) => upsert(prev, saved));
    return saved;
  }
  async function deactivateBuilding(id: string) {
    return updateBuilding(id, { active: false });
  }
  async function deleteBuilding(id: string) {
    await ucDeleteBuilding.exec(id);
    setBuildings((prev) => prev.filter((x) => x.id !== id));
  }

  // acciones rooms
  async function createRoom(payload: {
    name: string;
    buildingId: string;
    number: string;
    type: Room["type"];
    capacity: number;
  }) {
    const saved = await ucCreateRoom.exec(payload);
    setRooms((prev) => upsert(prev, saved));
    return saved;
  }
  async function updateRoom(
    id: string,
    patch: Partial<Omit<Room, "id" | "buildingName">> & { active?: boolean }
  ) {
    const saved = await ucUpdateRoom.exec(id, patch);
    setRooms((prev) => upsert(prev, saved));
    return saved;
  }
  async function reactivateRoom(id: string) {
    const saved = await ucReactivateRoom.exec(id);
    setRooms((prev) => upsert(prev, saved));
    return saved;
  }
  async function deactivateRoom(id: string) {
    return updateRoom(id, { active: false });
  }
  async function deleteRoom(id: string) {
    await ucDeleteRoom.exec(id);
    setRooms((prev) => prev.filter((x) => x.id !== id));
  }

  return {
    loading,
    stats,

    campus,
    campusQuery,
    setCampusQuery,
    campusFiltered,

    buildings,
    buildingsQuery,
    setBuildingsQuery,
    buildingsFiltered,

    rooms,
    roomsQuery,
    setRoomsQuery,
    roomsFiltered,

    parseError,

    // campus
    createCampus,
    updateCampus,
    reactivateCampus,
    deactivateCampus,
    deleteCampus,

    // buildings
    createBuilding,
    updateBuilding,
    reactivateBuilding,
    deactivateBuilding,
    deleteBuilding,

    // rooms
    createRoom,
    updateRoom,
    reactivateRoom,
    deactivateRoom,
    deleteRoom,
  };
}

export default useLocationState;
