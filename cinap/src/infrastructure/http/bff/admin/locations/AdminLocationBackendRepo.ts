// infrastructure/http/bff/admin/locations/AdminLocationBackendRepo.ts
import type { Campus, Building, Room } from "@domain/adminLocation";
import type AdminLocationRepo from "@application/admin-location/ports/AdminLocationRepo";

export class AdminLocationBackendRepo implements AdminLocationRepo {
  private lastSetCookies: string[] = [];

  constructor(
    private readonly baseUrl: string,
    private readonly cookie: string,
  ) {}

  getSetCookies(): string[] {
    return this.lastSetCookies;
  }

  private collectSetCookies(res: Response) {
    this.lastSetCookies = [];
    const anyHeaders = res.headers as any;
    const rawList: string[] =
      typeof anyHeaders.getSetCookie === "function"
        ? anyHeaders.getSetCookie()
        : (res.headers.get("set-cookie")
            ? [res.headers.get("set-cookie") as string]
            : []);
    this.lastSetCookies.push(...rawList);
  }

  private async parse<T>(res: Response): Promise<T> {
    const txt = await res.text();
    try { return JSON.parse(txt) as T; } catch { throw new Error(txt || `HTTP ${res.status}`); }
  }

  // ===== Campus =====
  async listCampus(): Promise<Campus[]> {
    const res = await fetch(`${this.baseUrl}/admin/locations/campus`, {
      method: "GET",
      headers: { cookie: this.cookie, accept: "application/json" },
      credentials: "include",
      cache: "no-store",
    });
    this.collectSetCookies(res);
    if (!res.ok) throw new Error(await res.text() || "No se pudieron cargar los campus");
    return this.parse<Campus[]>(res);
  }

  async createCampus(payload: { name: string; address: string }): Promise<Campus> {
    const res = await fetch(`${this.baseUrl}/admin/locations/campus`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json", cookie: this.cookie },
      credentials: "include",
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    this.collectSetCookies(res);
    const data = await this.parse<any>(res);
    if (!res.ok) throw new Error(data?.detail || data?.message || "No se pudo crear el campus");
    return data as Campus;
  }

  async updateCampus(id: string, patch: { name?: string; address?: string; active?: boolean }): Promise<Campus> {
    const method = patch.active !== undefined ? "PATCH" : "PUT";
    const res = await fetch(`${this.baseUrl}/admin/locations/campus/${id}`, {
      method,
      headers: { "content-type": "application/json", accept: "application/json", cookie: this.cookie },
      credentials: "include",
      body: JSON.stringify(patch),
      cache: "no-store",
    });
    this.collectSetCookies(res);
    const data = await this.parse<any>(res);
    if (!res.ok) throw new Error(data?.detail || data?.message || "No se pudo actualizar el campus");
    return data as Campus;
  }

  async deleteCampus(id: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/admin/locations/campus/${id}`, {
      method: "DELETE",
      headers: { cookie: this.cookie, accept: "application/json" },
      credentials: "include",
      cache: "no-store",
    });
    this.collectSetCookies(res);
    if (!res.ok) throw new Error(await res.text() || "No se pudo eliminar el campus");
  }

  async reactivateCampus(id: string): Promise<Campus> {
    const res = await fetch(`${this.baseUrl}/admin/locations/campus/${id}/reactivate`, {
      method: "POST",
      headers: { cookie: this.cookie, accept: "application/json" },
      credentials: "include",
      cache: "no-store",
    });
    this.collectSetCookies(res);
    const data = await this.parse<any>(res);
    if (!res.ok) throw new Error(data?.detail || data?.message || "No se pudo reactivar el campus");
    return data as Campus;
  }

  // ===== Buildings =====
  async listBuildings(params?: { campusId?: string }): Promise<Building[]> {
    const url = new URL(`${this.baseUrl}/admin/locations/buildings`);
    if (params?.campusId) url.searchParams.set("campusId", params.campusId);
    const res = await fetch(url, {
      method: "GET",
      headers: { cookie: this.cookie, accept: "application/json" },
      credentials: "include",
      cache: "no-store",
    });
    this.collectSetCookies(res);
    if (!res.ok) throw new Error(await res.text() || "No se pudieron cargar los edificios");
    return this.parse<Building[]>(res);
  }

  async createBuilding(payload: { name: string; campusId: string }): Promise<Building> {
    const res = await fetch(`${this.baseUrl}/admin/locations/buildings`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json", cookie: this.cookie },
      credentials: "include",
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    this.collectSetCookies(res);
    const data = await this.parse<any>(res);
    if (!res.ok) throw new Error(data?.detail || data?.message || "No se pudo crear el edificio");
    return data as Building;
  }

  async updateBuilding(id: string, patch: { name?: string; campusId?: string; active?: boolean }): Promise<Building> {
    const method = patch.active !== undefined ? "PATCH" : "PUT";
    const res = await fetch(`${this.baseUrl}/admin/locations/buildings/${id}`, {
      method,
      headers: { "content-type": "application/json", accept: "application/json", cookie: this.cookie },
      credentials: "include",
      body: JSON.stringify(patch),
      cache: "no-store",
    });
    this.collectSetCookies(res);
    const data = await this.parse<any>(res);
    if (!res.ok) throw new Error(data?.detail || data?.message || "No se pudo actualizar el edificio");
    return data as Building;
  }

  async deleteBuilding(id: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/admin/locations/buildings/${id}`, {
      method: "DELETE",
      headers: { cookie: this.cookie, accept: "application/json" },
      credentials: "include",
      cache: "no-store",
    });
    this.collectSetCookies(res);
    if (!res.ok) throw new Error(await res.text() || "No se pudo eliminar el edificio");
  }

  async reactivateBuilding(id: string): Promise<Building> {
    const res = await fetch(`${this.baseUrl}/admin/locations/buildings/${id}/reactivate`, {
      method: "POST",
      headers: { cookie: this.cookie, accept: "application/json" },
      credentials: "include",
      cache: "no-store",
    });
    this.collectSetCookies(res);
    const data = await this.parse<any>(res);
    if (!res.ok) throw new Error(data?.detail || data?.message || "No se pudo reactivar el edificio");
    return data as Building;
  }

  // ===== Rooms =====
  async listRooms(params?: { buildingId?: string }): Promise<Room[]> {
    const url = new URL(`${this.baseUrl}/admin/locations/rooms`);
    if (params?.buildingId) url.searchParams.set("buildingId", params.buildingId);
    const res = await fetch(url, {
      method: "GET",
      headers: { cookie: this.cookie, accept: "application/json" },
      credentials: "include",
      cache: "no-store",
    });
    this.collectSetCookies(res);
    if (!res.ok) throw new Error(await res.text() || "No se pudieron cargar las salas");
    return this.parse<Room[]>(res);
  }

  async createRoom(payload: {
    name: string;
    buildingId: string;
    number: string;
    type: string;
    capacity: number;
  }): Promise<Room> {
    const res = await fetch(`${this.baseUrl}/admin/locations/rooms`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json", cookie: this.cookie },
      credentials: "include",
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    this.collectSetCookies(res);
    const data = await this.parse<any>(res);
    if (!res.ok) throw new Error(data?.detail || data?.message || "No se pudo crear la sala");
    return data as Room;
  }

  async updateRoom(id: string, patch: {
    name?: string;
    buildingId?: string;
    number?: string;
    type?: string;
    capacity?: number;
    active?: boolean;
  }): Promise<Room> {
    const method = patch.active !== undefined ? "PATCH" : "PUT";
    const res = await fetch(`${this.baseUrl}/admin/locations/rooms/${id}`, {
      method,
      headers: { "content-type": "application/json", accept: "application/json", cookie: this.cookie },
      credentials: "include",
      body: JSON.stringify(patch),
      cache: "no-store",
    });
    this.collectSetCookies(res);
    const data = await this.parse<any>(res);
    if (!res.ok) throw new Error(data?.detail || data?.message || "No se pudo actualizar la sala");
    return data as Room;
  }

  async deleteRoom(id: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/admin/locations/rooms/${id}`, {
      method: "DELETE",
      headers: { cookie: this.cookie, accept: "application/json" },
      credentials: "include",
      cache: "no-store",
    });
    this.collectSetCookies(res);
    if (!res.ok) throw new Error(await res.text() || "No se pudo eliminar la sala");
  }

  async reactivateRoom(id: string): Promise<Room> {
    const res = await fetch(`${this.baseUrl}/admin/locations/rooms/${id}/reactivate`, {
      method: "POST",
      headers: { cookie: this.cookie, accept: "application/json" },
      credentials: "include",
      cache: "no-store",
    });
    this.collectSetCookies(res);
    const data = await this.parse<any>(res);
    if (!res.ok) throw new Error(data?.detail || data?.message || "No se pudo reactivar la sala");
    return data as Room;
  }
}
