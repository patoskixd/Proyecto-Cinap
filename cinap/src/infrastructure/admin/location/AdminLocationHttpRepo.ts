"use client";

import type { Campus, Building, Room } from "@/domain/admin/location";
import type { AdminLocationRepo } from "@/application/admin/location/ports/AdminLocationRepo";

async function parse<T>(res: Response): Promise<T> {
   const raw = await res.text();
  let data: any = null;
  try { data = raw ? JSON.parse(raw) : null; } catch { data = raw; }

  if (!res.ok) {
    const msg =
      (data && (data.detail || data.message)) ||
      (typeof data === "string" ? data : `HTTP ${res.status}`);
    throw new Error(msg);
  }
  return data as T;
}


const base = "/api/admin/locations";

export class AdminLocationHttpRepo implements AdminLocationRepo {
  // Campus
  async listCampus(): Promise<Campus[]> {
    const res = await fetch(`${base}/campus?page=1&limit=10000`, {
      method: "GET", credentials: "include", cache: "no-store",
      headers: { accept: "application/json" },
    });
    if (!res.ok) throw new Error((await res.text()) || "No se pudieron cargar los campus");
    const data = await parse<any>(res);
    return Array.isArray(data) ? (data as Campus[]) : (data?.items ?? []);
  }

  async createCampus(payload: { name: string; address: string; code: string }): Promise<Campus> {
    const res = await fetch(`${base}/campus`, { method: "POST", credentials: "include", headers: { "content-type": "application/json", accept: "application/json" }, body: JSON.stringify(payload) });
    return parse<Campus>(res);
  }
  async updateCampus(id: string, patch: { name?: string; address?: string; code?: string; active?: boolean }): Promise<Campus> {
    const method = patch.active !== undefined ? "PATCH" : "PUT";
    const res = await fetch(`${base}/campus/${id}`, { method, credentials: "include", headers: { "content-type": "application/json", accept: "application/json" }, body: JSON.stringify(patch) });

    return parse<Campus>(res);
  }
  async deleteCampus(id: string): Promise<void> {
    const res = await fetch(`${base}/campus/${id}`, { method: "DELETE", credentials: "include", headers: { accept: "application/json" } });
    return parse<void>(res);
  }
  async reactivateCampus(id: string): Promise<Campus> {
    const res = await fetch(`${base}/campus/${id}/reactivate`, { method: "POST", credentials: "include", headers: { accept: "application/json" } });
    return parse<Campus>(res);
  }

  // Buildings
  async listBuildings(params?: { campusId?: string }): Promise<Building[]> {
    const sp = new URLSearchParams({ page: "1", limit: "10000" });
    if (params?.campusId) sp.set("campusId", params.campusId);

    const res = await fetch(`${base}/buildings?${sp.toString()}`, {
      method: "GET", credentials: "include", cache: "no-store",
      headers: { accept: "application/json" },
    });
    const data = await parse<any>(res);
    return Array.isArray(data) ? (data as Building[]) : (data?.items ?? []);
  }
  async createBuilding(payload: { name: string; campusId: string; code?: string }): Promise<Building> {
    const res = await fetch(`${base}/buildings`, { method: "POST", credentials: "include", headers: { "content-type": "application/json", accept: "application/json" }, body: JSON.stringify(payload) });
    return parse<Building>(res);
  }
  async updateBuilding(id: string, patch: { name?: string; campusId?: string; code?: string; active?: boolean }): Promise<Building> {
    const method = patch.active !== undefined ? "PATCH" : "PUT";
    const res = await fetch(`${base}/buildings/${id}`, { method, credentials: "include", headers: { "content-type": "application/json", accept: "application/json" }, body: JSON.stringify(patch) });
    return parse<Building>(res);
  }
  async deleteBuilding(id: string): Promise<void> {
    const res = await fetch(`${base}/buildings/${id}`, { method: "DELETE", credentials: "include", headers: { accept: "application/json" } });
    return parse<void>(res);
  }
  async reactivateBuilding(id: string): Promise<Building> {
    const res = await fetch(`${base}/buildings/${id}/reactivate`, { method: "POST", credentials: "include", headers: { accept: "application/json" } });
    return parse<Building>(res);
  }

  // Rooms
  async listRooms(params?: { buildingId?: string }): Promise<Room[]> {
      const sp = new URLSearchParams({ page: "1", limit: "10000" });
      if (params?.buildingId) sp.set("buildingId", params.buildingId);

      const res = await fetch(`${base}/rooms?${sp.toString()}`, {
        method: "GET", credentials: "include", cache: "no-store",
        headers: { accept: "application/json" },
      });
      const data = await parse<any>(res);
      return Array.isArray(data) ? (data as Room[]) : (data?.items ?? []);
    }
  async createRoom(payload: { name: string; buildingId: string; number: string; type: Room["type"]; capacity: number }): Promise<Room> {
    const res = await fetch(`${base}/rooms`, { method: "POST", credentials: "include", headers: { "content-type": "application/json", accept: "application/json" }, body: JSON.stringify(payload) });
    return parse<Room>(res);
  }
  async updateRoom(id: string, patch: { name?: string; buildingId?: string; number?: string; type?: Room["type"]; capacity?: number; active?: boolean }): Promise<Room> {
    const method = patch.active !== undefined ? "PATCH" : "PUT";
    const res = await fetch(`${base}/rooms/${id}`, { method, credentials: "include", headers: { "content-type": "application/json", accept: "application/json" }, body: JSON.stringify(patch) });
    return parse<Room>(res);
  }
  async deleteRoom(id: string): Promise<void> {
    const res = await fetch(`${base}/rooms/${encodeURIComponent(id)}`, { method: "DELETE", credentials: "include", headers: { accept: "application/json" } });
    return parse<void>(res);
  }
  async reactivateRoom(id: string): Promise<Room> {
    const res = await fetch(`${base}/rooms/${id}/reactivate`, { method: "POST", credentials: "include", headers: { accept: "application/json" } });
    return parse<Room>(res);
  }
    // paginación
async listCampusPage(params?: { page?: number; limit?: number; q?: string; active?: boolean }) {
    const sp = new URLSearchParams();
    if (params?.page)  sp.set("page", String(params.page));
    if (params?.limit) sp.set("limit", String(params.limit));
    if (params?.q)     sp.set("q", params.q);
    if (params?.active !== undefined) sp.set("active", String(params.active));
    const res = await fetch(`${base}/campus?${sp.toString()}`, {
      method: "GET", credentials: "include", cache: "no-store",
      headers: { accept: "application/json" }
    });
    return parse<import("@/application/admin/location/ports/AdminLocationRepo").Page<Campus, any>>(res);
  }

  async listBuildingsPage(params?: { campusId?: string; page?: number; limit?: number; q?: string; active?: boolean }) {
    const sp = new URLSearchParams();
    if (params?.campusId) sp.set("campusId", params.campusId);
    if (params?.page)     sp.set("page", String(params.page));
    if (params?.limit)    sp.set("limit", String(params.limit));
    if (params?.q)        sp.set("q", params.q);
    if (params?.active !== undefined) sp.set("active", String(params.active));
    // 👇 FIX de ruta
    const res = await fetch(`${base}/buildings?${sp.toString()}`, {
      method: "GET", credentials: "include", cache: "no-store",
      headers: { accept: "application/json" }
    });
    return parse<import("@/application/admin/location/ports/AdminLocationRepo").Page<Building, any>>(res);
  }

  async listRoomsPage(params?: { buildingId?: string; page?: number; limit?: number; q?: string; active?: boolean }) {
    const sp = new URLSearchParams();
    if (params?.buildingId) sp.set("buildingId", params.buildingId);
    if (params?.page)       sp.set("page", String(params.page));
    if (params?.limit)      sp.set("limit", String(params.limit));
    if (params?.q)          sp.set("q", params.q);
    if (params?.active !== undefined) sp.set("active", String(params.active));
    const res = await fetch(`${base}/rooms?${sp.toString()}`, {
      method: "GET", credentials: "include", cache: "no-store",
      headers: { accept: "application/json" }
    });
    return parse<import("@/application/admin/location/ports/AdminLocationRepo").Page<Room, any>>(res);
  }
}

