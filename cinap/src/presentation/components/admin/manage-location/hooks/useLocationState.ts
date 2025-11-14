"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Campus, Building, Room } from "@/domain/admin/location";
import { AdminLocationHttpRepo } from "@/infrastructure/admin/location/AdminLocationHttpRepo";

// Usecases
import ListCampusPage from "@/application/admin/location/usecases/Campus/ListCampusPage";
import CreateCampus from "@/application/admin/location/usecases/Campus/CreateCampus";
import UpdateCampus from "@/application/admin/location/usecases/Campus/UpdateCampus";
import ReactivateCampus from "@/application/admin/location/usecases/Campus/ReactivateCampus";
import DeleteCampus from "@/application/admin/location/usecases/Campus/DeleteCampus";

import ListBuildingsPage from "@/application/admin/location/usecases/Buildings/ListBuildingsPage";
import CreateBuilding from "@/application/admin/location/usecases/Buildings/CreateBuilding";
import UpdateBuilding from "@/application/admin/location/usecases/Buildings/UpdateBuildings";
import ReactivateBuilding from "@/application/admin/location/usecases/Buildings/ReactivateBuildings";
import DeleteBuilding from "@/application/admin/location/usecases/Buildings/DeleteBuildings";

import ListRoomsPage from "@/application/admin/location/usecases/Rooms/ListRoomsPage";
import CreateRoom from "@/application/admin/location/usecases/Rooms/CreateRooms";
import UpdateRoom from "@/application/admin/location/usecases/Rooms/UpdateRooms";
import ReactivateRoom from "@/application/admin/location/usecases/Rooms/ReactivateRooms";
import DeleteRoom from "@/application/admin/location/usecases/Rooms/DeleteRooms";

// Paginación del backend 
type PageResp<T, S = any> = {
  items: T[];
  page: number;
  per_page: number;
  total: number;
  pages: number;
  stats?: S;
};

// Utils 
function parseError(e: unknown): string {
  if (e instanceof Error) return e.message;
  try { return JSON.stringify(e); } catch { return String(e); }
}
function makeSetPage(loader: (p: number) => Promise<void>) {
  return (p: number) => { void loader(p); };
}

// helpers 
function toggleInList<T extends { id: string; active: boolean }>(
  list: T[], id: string, newActive: boolean,
): T[] {
  return list.map(x => (x.id === id ? { ...x, active: newActive } as T : x));
}

// Si hay filtro por activos, 
function removeIfNotMatchFilter<T extends { id: string; active: boolean }>(
  list: T[], id: string, newActive: boolean, activeFilter: boolean | undefined,
): T[] {
  if (activeFilter === true && newActive === false) return list.filter(x => x.id !== id);
  if (activeFilter === false && newActive === true) return list.filter(x => x.id !== id);
  return toggleInList(list, id, newActive);
}

// Ajusta solo los contadores de activos/inactivos
function bumpStatsOnlyActives(
  stats: any | undefined,
  { becameActive }: { becameActive: boolean }
) {
  if (!stats) return stats;
  const s = { ...stats };
  if (typeof s.activos === "number")   s.activos   = Math.max(0, s.activos + (becameActive ? 1 : -1));
  if (typeof s.inactivos === "number") s.inactivos = Math.max(0, s.inactivos + (becameActive ? -1 : 1));
  return s;
}

export default function useLocationState() {
  const repo = useMemo(() => new AdminLocationHttpRepo(), []);

  // filtros 
  const [campusQuery, setCampusQuery] = useState("");
  const [campusActive, setCampusActive] = useState<boolean | undefined>(undefined);
  const [buildingsQuery, setBuildingsQuery] = useState("");
  const [buildingsActive, setBuildingsActive] = useState<boolean | undefined>(undefined);
  const [roomsQuery, setRoomsQuery] = useState("");
  const [roomsActive, setRoomsActive] = useState<boolean | undefined>(undefined);

  //  jerarquía 
  const [selectedCampusId, setSelectedCampusId] = useState<string | undefined>(undefined);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | undefined>(undefined);

  // estado por entidad 
  const [campusPage, _setCampusPage] = useState(1);
  const [campusPages, setCampusPages] = useState(1);
  const [campusTotal, setCampusTotal] = useState(0);
  const [campusItems, setCampusItems] = useState<Campus[]>([]);
  const [campusStats, setCampusStats] = useState<any | undefined>(undefined);

  const [buildingsPage, _setBuildingsPage] = useState(1);
  const [buildingsPages, setBuildingsPages] = useState(1);
  const [buildingsTotal, setBuildingsTotal] = useState(0);
  const [buildingsItems, setBuildingsItems] = useState<Building[]>([]);
  const [buildingsStats, setBuildingsStats] = useState<any | undefined>(undefined);

  const [roomsPage, _setRoomsPage] = useState(1);
  const [roomsPages, setRoomsPages] = useState(1);
  const [roomsTotal, setRoomsTotal] = useState(0);
  const [roomsItems, setRoomsItems] = useState<Room[]>([]);
  const [roomsStats, setRoomsStats] = useState<any | undefined>(undefined);

  const [loading, setLoading] = useState(false);

  //  loaders 
  const loadCampus = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const data: PageResp<Campus> = await new ListCampusPage(repo).exec({
        page, limit: 20, q: campusQuery || undefined, active: campusActive,
      });
      setCampusItems(data.items);
      _setCampusPage(data.page);
      setCampusPages(data.pages);
      setCampusTotal(data.total);
      setCampusStats(data.stats);
    } finally { setLoading(false); }
  }, [repo, campusQuery, campusActive]);

  const loadBuildings = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const data: PageResp<Building> = await new ListBuildingsPage(repo).exec({
        campusId: selectedCampusId, 
        page, limit: 20,
        q: buildingsQuery || undefined,
        active: buildingsActive,
      });
      setBuildingsItems(data.items);
      _setBuildingsPage(data.page);
      setBuildingsPages(data.pages);
      setBuildingsTotal(data.total);
      setBuildingsStats(data.stats);
    } finally { setLoading(false); }
  }, [repo, selectedCampusId, buildingsQuery, buildingsActive]);

  const loadRooms = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const data: PageResp<Room> = await new ListRoomsPage(repo).exec({
        buildingId: selectedBuildingId, 
        page, limit: 20,
        q: roomsQuery || undefined,
        active: roomsActive,
      });
      setRoomsItems(data.items);
      _setRoomsPage(data.page);
      setRoomsPages(data.pages);
      setRoomsTotal(data.total);
      setRoomsStats(data.stats);
    } finally { setLoading(false); }
  }, [repo, selectedBuildingId, roomsQuery, roomsActive]);

  //  helpers de recarga cruzada 
  const refreshAll = useCallback(async () => {
    await Promise.allSettled([loadCampus(campusPage), loadBuildings(buildingsPage), loadRooms(roomsPage)]);
  }, [loadCampus, loadBuildings, loadRooms, campusPage, buildingsPage, roomsPage]);

  const refreshAfterCampusMutation = useCallback(async () => {
    // Campus puede afectar edificios y salas por cascada
    await Promise.allSettled([loadCampus(campusPage), loadBuildings(1), loadRooms(1)]);
  }, [loadCampus, loadBuildings, loadRooms, campusPage]);

  const refreshAfterBuildingMutation = useCallback(async () => {
    // Edificio puede afectar salas por cascada
    await Promise.allSettled([loadBuildings(buildingsPage), loadRooms(1)]);
  }, [loadBuildings, loadRooms, buildingsPage]);

  // inicial
  useEffect(() => { void loadCampus(1); }, [loadCampus]); 

  // recargas por filtros
  useEffect(() => { void loadCampus(1); }, [campusQuery, campusActive, loadCampus]); 
  useEffect(() => { void loadBuildings(1); }, [selectedCampusId, buildingsQuery, buildingsActive, loadBuildings]); 
  useEffect(() => { void loadRooms(1); }, [selectedBuildingId, roomsQuery, roomsActive, loadRooms]); 

  // paginacion
  const setCampusPage = makeSetPage(loadCampus);
  const setBuildingsPage = makeSetPage(loadBuildings);
  const setRoomsPage = makeSetPage(loadRooms);

  const nextCampus = () => (campusPage < campusPages ? loadCampus(campusPage + 1) : undefined);
  const prevCampus = () => (campusPage > 1 ? loadCampus(campusPage - 1) : undefined);
  const nextBuildings = () => (buildingsPage < buildingsPages ? loadBuildings(buildingsPage + 1) : undefined);
  const prevBuildings = () => (buildingsPage > 1 ? loadBuildings(buildingsPage - 1) : undefined);
  const nextRooms = () => (roomsPage < roomsPages ? loadRooms(roomsPage + 1) : undefined);
  const prevRooms = () => (roomsPage > 1 ? loadRooms(roomsPage - 1) : undefined);

  //  acciones 
  // ---- Campus
  const createCampus = async (payload: { name: string; address: string; code: string }) => {
    await new CreateCampus(repo).exec(payload);
    await refreshAll();
  };

  const updateCampus = async (id: string, patch: { name?: string; address?: string; code?: string; active?: boolean }) => {
    const updated = await new UpdateCampus(repo).exec(id, patch);
    setCampusItems(prev => prev.map(c => (c.id === id ? { ...c, ...updated } : c)));
    if (typeof patch.active === "boolean") await refreshAfterCampusMutation();
    else await loadCampus(campusPage);
  };

  const reactivateCampus = async (id: string) => {
    await new ReactivateCampus(repo).exec(id);
    setCampusItems(prev => removeIfNotMatchFilter(prev, id, true, campusActive));
    setCampusStats((prev: any) => bumpStatsOnlyActives(prev, { becameActive: true }));
    await refreshAfterCampusMutation();
  };

  const deactivateCampus = async (id: string) => {
    await new UpdateCampus(repo).exec(id, { active: false } as any);
    setCampusItems(prev => removeIfNotMatchFilter(prev, id, false, campusActive));
    setCampusStats((prev: any) => bumpStatsOnlyActives(prev, { becameActive: false }));
    await refreshAfterCampusMutation();
  };

  const deleteCampus = async (id: string) => {
    await new DeleteCampus(repo).exec(id);
    setCampusItems(prev => prev.filter(c => c.id !== id));
    setCampusTotal(t => Math.max(0, t - 1));
    await Promise.allSettled([loadBuildings(1), loadRooms(1)]);
    await loadCampus(campusPage);
  };

  // ---- Buildings
  const createBuilding = async (payload: { name: string; campusId: string; code: string }) => {
    await new CreateBuilding(repo).exec(payload);
    await refreshAfterCampusMutation(); 
  };

  const updateBuilding = async (id: string, patch: { name?: string; campusId?: string; code?: string; active?: boolean }) => {
    const updated = await new UpdateBuilding(repo).exec(id, patch);
    if (selectedCampusId && updated.campusId !== selectedCampusId) {
      setBuildingsItems(prev => prev.filter(b => b.id !== id));
    } else {
      setBuildingsItems(prev => prev.map(b => (b.id === id ? { ...b, ...updated } : b)));
    }
    if (typeof patch.active === "boolean") await refreshAfterBuildingMutation();
    else await loadBuildings(buildingsPage);
  };

  const reactivateBuilding = async (id: string) => {
    await new ReactivateBuilding(repo).exec(id);
    setBuildingsItems(prev => removeIfNotMatchFilter(prev, id, true, buildingsActive));
    setBuildingsStats((prev: any) => bumpStatsOnlyActives(prev, { becameActive: true }));
    await refreshAfterBuildingMutation();
  };

  const deactivateBuilding = async (id: string) => {
    await new UpdateBuilding(repo).exec(id, { active: false } as any);
    setBuildingsItems(prev => removeIfNotMatchFilter(prev, id, false, buildingsActive));
    setBuildingsStats((prev: any) => bumpStatsOnlyActives(prev, { becameActive: false }));
    await refreshAfterBuildingMutation();
  };

  const deleteBuilding = async (id: string) => {
    await new DeleteBuilding(repo).exec(id);
    setBuildingsItems(prev => prev.filter(b => b.id !== id));
    setBuildingsTotal(t => Math.max(0, t - 1));
    await Promise.allSettled([loadRooms(1), loadBuildings(buildingsPage)]);
  };

  // ---- Rooms
  const createRoom = async (payload: { name: string; buildingId: string; number: string; type: string; capacity: number }) => {
    await new CreateRoom(repo).exec(payload);
    await Promise.allSettled([loadRooms(1), loadBuildings(buildingsPage), loadCampus(campusPage)]);
  };

  const updateRoom = async (id: string, patch: { name?: string; buildingId?: string; number?: string; type?: string; capacity?: number; active?: boolean }) => {
    const updated = await new UpdateRoom(repo).exec(id, patch);
    if (selectedBuildingId && updated.buildingId !== selectedBuildingId) {
      setRoomsItems(prev => prev.filter(r => r.id !== id));
    } else {
      setRoomsItems(prev => prev.map(r => (r.id === id ? { ...r, ...updated } : r)));
    }
    if (typeof patch.active === "boolean") {
      await Promise.allSettled([loadRooms(roomsPage), loadBuildings(buildingsPage)]);
    } else {
      await loadRooms(roomsPage);
    }
  };

  const reactivateRoom = async (id: string) => {
    await new ReactivateRoom(repo).exec(id);
    setRoomsItems(prev => removeIfNotMatchFilter(prev, id, true, roomsActive));
    setRoomsStats((prev: any) => bumpStatsOnlyActives(prev, { becameActive: true }));
    await loadRooms(roomsPage);
  };

  const deactivateRoom = async (id: string) => {
    await new UpdateRoom(repo).exec(id, { active: false } as any);
    setRoomsItems(prev => removeIfNotMatchFilter(prev, id, false, roomsActive));
    setRoomsStats((prev: any) => bumpStatsOnlyActives(prev, { becameActive: false }));
    await loadRooms(roomsPage);
  };

  const deleteRoom = async (id: string) => {
    await new DeleteRoom(repo).exec(id);
    setRoomsItems(prev => prev.filter(r => r.id !== id));
    setRoomsTotal(t => Math.max(0, t - 1));
    await loadRooms(roomsPage);
  };

  //  alias para el componente 
  const campusPageItems = campusItems;
  const buildingsPageItems = buildingsItems;
  const roomsPageItems = roomsItems;

  const campusFiltered = campusItems;
  const buildingsFiltered = buildingsItems;
  const roomsFiltered = roomsItems;
  // Estadísticas combinadas
  const stats = {
    totalCampus:    campusStats?.total    ?? campusTotal ?? 0,
    totalBuildings: buildingsStats?.total ?? buildingsTotal ?? 0,
    totalRooms:     roomsStats?.total     ?? roomsTotal ?? 0,
    totalCapacity:
      (roomsStats as any)?.totalCapacity ??
      (roomsStats as any)?.capacitySum ??
      (roomsStats as any)?.capacity_sum_active ??
      roomsItems.reduce((acc, r) => acc + (Number(r.capacity) || 0), 0),
  };

  return {
    // seleccion jerarquica
    selectedCampusId, setSelectedCampusId,
    selectedBuildingId, setSelectedBuildingId,

    // campus
    campusFiltered, campusQuery, setCampusQuery,
    campusActive, setCampusActive,
    campusPage, campusPages, setCampusPage, campusPageItems,

    // buildings
    buildingsFiltered, buildingsQuery, setBuildingsQuery,
    buildingsActive, setBuildingsActive,
    buildingsPage, buildingsPages, setBuildingsPage, buildingsPageItems,

    // rooms
    roomsFiltered, roomsQuery, setRoomsQuery,
    roomsActive, setRoomsActive,
    roomsPage, roomsPages, setRoomsPage, roomsPageItems,

    // acciones
    createCampus, updateCampus, reactivateCampus, deactivateCampus, deleteCampus,
    createBuilding, updateBuilding, reactivateBuilding, deactivateBuilding, deleteBuilding,
    createRoom, updateRoom, reactivateRoom, deactivateRoom, deleteRoom,

    // navegación auxiliar
    loadCampus, loadBuildings, loadRooms,
    nextCampus, prevCampus, nextBuildings, prevBuildings, nextRooms, prevRooms,

    // otros
    stats, parseError, loading,
  };
}
