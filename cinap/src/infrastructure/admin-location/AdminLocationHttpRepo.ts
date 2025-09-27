import type { AdminLocationRepo, Campus, Building, Room } from "@/domain/adminLocation";

const base = "/api/admin/locations";

async function req<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    cache: "no-store",
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      msg = j?.message || j?.detail || msg;
    } catch {}
    throw new Error(msg);
  }
  return res.status === 204 ? (undefined as unknown as T) : res.json();
}

export class AdminLocationHttpRepo implements AdminLocationRepo {
  // Campus
  listCampus() { return req<Campus[]>(`${base}/campus`); }
  createCampus(payload: { name: string; address: string }) {
    return req<Campus>(`${base}/campus`, { method: "POST", body: JSON.stringify(payload) });
  }
  updateCampus(id: string, patch: { name?: string; address?: string }) {
    return req<Campus>(`${base}/campus/${id}`, { method: "PUT", body: JSON.stringify(patch) });
  }
  reactivateCampus(id: string) {
    return req<Campus>(`${base}/campus/${id}/reactivate`, { method: "POST" });
  }
  deleteCampus(id: string) {
    return req<void>(`${base}/campus/${id}`, { method: "DELETE" });
  }

  // Buildings
  listBuildings(params?: { campusId?: string }) {
    const url = new URL(`${base}/buildings`, window.location.origin);
    if (params?.campusId) url.searchParams.set("campusId", params.campusId);
    return req<Building[]>(url.toString());
  }
  createBuilding(payload: { name: string; campusId: string }) {
    return req<Building>(`${base}/buildings`, { method: "POST", body: JSON.stringify(payload) });
  }
  updateBuilding(id: string, patch: { name?: string; campusId?: string }) {
    return req<Building>(`${base}/buildings/${id}`, { method: "PUT", body: JSON.stringify(patch) });
  }
  reactivateBuilding(id: string) {
    return req<Building>(`${base}/buildings/${id}/reactivate`, { method: "POST" });
  }
  deleteBuilding(id: string) {
    return req<void>(`${base}/buildings/${id}`, { method: "DELETE" });
  }

  // Rooms
  listRooms(params?: { buildingId?: string }) {
    const url = new URL(`${base}/rooms`, window.location.origin);
    if (params?.buildingId) url.searchParams.set("buildingId", params.buildingId);
    return req<Room[]>(url.toString());
  }
  createRoom(payload: { name: string; buildingId: string; number: string; type: Room["type"]; capacity: number }) {
    return req<Room>(`${base}/rooms`, { method: "POST", body: JSON.stringify(payload) });
  }
  updateRoom(id: string, patch: { name?: string; buildingId?: string; number?: string; type?: Room["type"]; capacity?: number }) {
    return req<Room>(`${base}/rooms/${id}`, { method: "PUT", body: JSON.stringify(patch) });
  }
  reactivateRoom(id: string) {
    return req<Room>(`${base}/rooms/${id}/reactivate`, { method: "POST" });
  }
  deleteRoom(id: string) {
    return req<void>(`${base}/rooms/${id}`, { method: "DELETE" });
  }
}
