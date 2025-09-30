"use client";

import type { Campus, Building, Room } from "@domain/adminLocation";
import type { AdminLocationRepo } from "@application/admin-location/ports/AdminLocationRepo";

async function parse<T>(res: Response): Promise<T> {
  const txt = await res.text();
  const ct = res.headers.get("content-type") || "";
  const isHtml = ct.includes("text/html");
  if (isHtml) throw new Error("Ruta /api/admin/locations no encontrada (404). Revisa los route.ts y reinicia el dev server.");
  try { return JSON.parse(txt) as T; } catch { throw new Error(txt || `HTTP ${res.status}`); }
}

const base = "/api/admin/locations";

export class AdminLocationHttpRepo implements AdminLocationRepo {
  // Campus
  async listCampus(): Promise<Campus[]> {
    const res = await fetch(`${base}/campus`, { method: "GET", credentials: "include", cache: "no-store", headers: { accept: "application/json" } });
    if (!res.ok) throw new Error((await res.text()) || "No se pudieron cargar los campus");
    return parse<Campus[]>(res);
  }
  async createCampus(payload: { name: string; address: string }): Promise<Campus> {
    const res = await fetch(`${base}/campus`, { method: "POST", credentials: "include", headers: { "content-type": "application/json", accept: "application/json" }, body: JSON.stringify(payload) });
    if (!res.ok) throw new Error((await res.text()) || "No se pudo crear el campus");
    return parse<Campus>(res);
  }
  async updateCampus(id: string, patch: { name?: string; address?: string; active?: boolean }): Promise<Campus> {
    // Si incluye active, usar PATCH (para desactivar), si no usar PUT (para actualizaciones completas)
    const method = patch.active !== undefined ? "PATCH" : "PUT";
    const res = await fetch(`${base}/campus/${id}`, { method, credentials: "include", headers: { "content-type": "application/json", accept: "application/json" }, body: JSON.stringify(patch) });
    if (!res.ok) throw new Error((await res.text()) || "No se pudo actualizar el campus");
    return parse<Campus>(res);
  }
  async deleteCampus(id: string): Promise<void> {
    const res = await fetch(`${base}/campus/${id}`, { method: "DELETE", credentials: "include", headers: { accept: "application/json" } });
    if (!res.ok) throw new Error((await res.text()) || "No se pudo eliminar el campus");
  }
  async reactivateCampus(id: string): Promise<Campus> {
    const res = await fetch(`${base}/campus/${id}/reactivate`, { method: "POST", credentials: "include", headers: { accept: "application/json" } });
    if (!res.ok) throw new Error((await res.text()) || "No se pudo reactivar el campus");
    return parse<Campus>(res);
  }

  // Buildings
  async listBuildings(params?: { campusId?: string }): Promise<Building[]> {
    const qs = params?.campusId ? `?campusId=${encodeURIComponent(params.campusId)}` : "";
    const res = await fetch(`${base}/buildings${qs}`, { method: "GET", credentials: "include", cache: "no-store", headers: { accept: "application/json" } });
    if (!res.ok) throw new Error((await res.text()) || "No se pudieron cargar los edificios");
    return parse<Building[]>(res);
  }
  async createBuilding(payload: { name: string; campusId: string }): Promise<Building> {
    const res = await fetch(`${base}/buildings`, { method: "POST", credentials: "include", headers: { "content-type": "application/json", accept: "application/json" }, body: JSON.stringify(payload) });
    if (!res.ok) throw new Error((await res.text()) || "No se pudo crear el edificio");
    return parse<Building>(res);
  }
  async updateBuilding(id: string, patch: { name?: string; campusId?: string; active?: boolean }): Promise<Building> {
    // Si incluye active, usar PATCH (para desactivar), si no usar PUT (para actualizaciones completas)
    const method = patch.active !== undefined ? "PATCH" : "PUT";
    const res = await fetch(`${base}/buildings/${id}`, { method, credentials: "include", headers: { "content-type": "application/json", accept: "application/json" }, body: JSON.stringify(patch) });
    if (!res.ok) throw new Error((await res.text()) || "No se pudo actualizar el edificio");
    return parse<Building>(res);
  }
  async deleteBuilding(id: string): Promise<void> {
    const res = await fetch(`${base}/buildings/${id}`, { method: "DELETE", credentials: "include", headers: { accept: "application/json" } });
    if (!res.ok) throw new Error((await res.text()) || "No se pudo eliminar el edificio");
  }
  async reactivateBuilding(id: string): Promise<Building> {
    const res = await fetch(`${base}/buildings/${id}/reactivate`, { method: "POST", credentials: "include", headers: { accept: "application/json" } });
    if (!res.ok) throw new Error((await res.text()) || "No se pudo reactivar el edificio");
    return parse<Building>(res);
  }

  // Rooms
  async listRooms(params?: { buildingId?: string }): Promise<Room[]> {
    const qs = params?.buildingId ? `?buildingId=${encodeURIComponent(params.buildingId)}` : "";
    const res = await fetch(`${base}/rooms${qs}`, { method: "GET", credentials: "include", cache: "no-store", headers: { accept: "application/json" } });
    if (!res.ok) throw new Error((await res.text()) || "No se pudieron cargar las salas");
    return parse<Room[]>(res);
  }
  async createRoom(payload: { name: string; buildingId: string; number: string; type: Room["type"]; capacity: number }): Promise<Room> {
    const res = await fetch(`${base}/rooms`, { method: "POST", credentials: "include", headers: { "content-type": "application/json", accept: "application/json" }, body: JSON.stringify(payload) });
    if (!res.ok) throw new Error((await res.text()) || "No se pudo crear la sala");
    return parse<Room>(res);
  }
  async updateRoom(id: string, patch: { name?: string; buildingId?: string; number?: string; type?: Room["type"]; capacity?: number; active?: boolean }): Promise<Room> {
    // Si incluye active, usar PATCH (para desactivar), si no usar PUT (para actualizaciones completas)
    const method = patch.active !== undefined ? "PATCH" : "PUT";
    const res = await fetch(`${base}/rooms/${id}`, { method, credentials: "include", headers: { "content-type": "application/json", accept: "application/json" }, body: JSON.stringify(patch) });
    if (!res.ok) throw new Error((await res.text()) || "No se pudo actualizar la sala");
    return parse<Room>(res);
  }
  async deleteRoom(id: string): Promise<void> {
    const res = await fetch(`${base}/rooms/${id}`, { method: "DELETE", credentials: "include", headers: { accept: "application/json" } });
    if (!res.ok) throw new Error((await res.text()) || "No se pudo eliminar la sala");
  }
  async reactivateRoom(id: string): Promise<Room> {
    const res = await fetch(`${base}/rooms/${id}/reactivate`, { method: "POST", credentials: "include", headers: { accept: "application/json" } });
    if (!res.ok) throw new Error((await res.text()) || "No se pudo reactivar la sala");
    return parse<Room>(res);
  }
}
