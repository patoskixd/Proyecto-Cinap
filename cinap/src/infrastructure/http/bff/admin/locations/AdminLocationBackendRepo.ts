import type { Campus, Building, Room } from "@/domain/admin/location";
import type AdminLocationRepo from "@/application/admin/location/ports/AdminLocationRepo";

export type Page<T, S = any> = {
  items: T[];
  page: number;
  per_page: number;
  total: number;
  pages: number;
  stats?: S;
};


export type CampusStats = any;
export type BuildingStats = any;
export type RoomStats   = any;


export class HttpError extends Error {
  status: number;
  detail?: string;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.detail = message;
  }
}


export class AdminLocationBackendRepo implements AdminLocationRepo {
  private lastSetCookies: string[] = [];
  private readonly baseUrl: string;
  private readonly cookie: string;

  constructor(cookie: string) {
    this.baseUrl = process.env.BACKEND_URL || "http://localhost:8000";
    this.cookie = cookie;
  }

  getSetCookies(): string[] { return this.lastSetCookies; }

  private collectSetCookies(res: Response) {
    this.lastSetCookies = [];
    const anyHeaders = res.headers as any;
    const rawList: string[] =
      typeof anyHeaders.getSetCookie === "function"
        ? anyHeaders.getSetCookie()
        : (res.headers.get("set-cookie") ? [res.headers.get("set-cookie") as string] : []);
    this.lastSetCookies.push(...rawList);
  }

  //  Helpers 
   private async parseOrThrow<T>(res: Response): Promise<T> {
    const raw = await res.text();
    let data: any = null;
    try { data = raw ? JSON.parse(raw) : null; } catch { data = raw; }

    if (!res.ok) {
      const msg =
        (data && (data.detail || data.message)) ||
        (typeof data === "string" ? data : `HTTP ${res.status}`);
      throw new HttpError(res.status, msg);
    }
    return data as T;
  }

  


  private toArray<T>(data: any): T[] {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.items)) return data.items as T[];
    return [];
  }

  
  //  CAMPUS 
  
  async listCampus(): Promise<Campus[]> {
    const url = new URL(`${this.baseUrl}/admin/locations/campus`);
    url.searchParams.set("page", "1");
    url.searchParams.set("limit", "10000");

    const res = await fetch(url, {
      method: "GET",
      headers: { cookie: this.cookie, accept: "application/json" },
      credentials: "include",
      cache: "no-store",
    });
    this.collectSetCookies(res);
    const data = await this.parseOrThrow<any>(res);
    return this.toArray<Campus>(data);
  }

  async createCampus(payload: { name: string; address: string; code?: string }): Promise<Campus> {
    const res = await fetch(`${this.baseUrl}/admin/locations/campus`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json", cookie: this.cookie },
      credentials: "include",
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    this.collectSetCookies(res);
    return this.parseOrThrow<Campus>(res);
  }

  async updateCampus(
    id: string,
    patch: { name?: string; address?: string; code?: string; active?: boolean }
  ): Promise<Campus> {
    const method = patch.active !== undefined ? "PATCH" : "PUT";
    const res = await fetch(`${this.baseUrl}/admin/locations/campus/${encodeURIComponent(id)}`, {
      method,
      headers: { "content-type": "application/json", accept: "application/json", cookie: this.cookie },
      credentials: "include",
      body: JSON.stringify(patch),
      cache: "no-store",
    });
    this.collectSetCookies(res);
    return this.parseOrThrow<Campus>(res);
  }

  async deleteCampus(id: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/admin/locations/campus/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { cookie: this.cookie, accept: "application/json" },
      credentials: "include",
      cache: "no-store",
    });
    this.collectSetCookies(res);
    await this.parseOrThrow<void>(res);
  }

  async reactivateCampus(id: string): Promise<Campus> {
    const res = await fetch(`${this.baseUrl}/admin/locations/campus/${encodeURIComponent(id)}/reactivate`, {
      method: "POST",
      headers: { cookie: this.cookie, accept: "application/json" },
      credentials: "include",
      cache: "no-store",
    });
    this.collectSetCookies(res);
    return this.parseOrThrow<Campus>(res);
  }


  //  BUILDINGS  
  async listBuildings(params?: { campusId?: string }): Promise<Building[]> {
    const url = new URL(`${this.baseUrl}/admin/locations/buildings`);
    url.searchParams.set("page", "1");
    url.searchParams.set("limit", "10000");
    if (params?.campusId) url.searchParams.set("campusId", params.campusId);

    const res = await fetch(url, {
      method: "GET",
      headers: { cookie: this.cookie, accept: "application/json" },
      credentials: "include",
      cache: "no-store",
    });
    this.collectSetCookies(res);
    const data = await this.parseOrThrow<any>(res);
    return this.toArray<Building>(data);
  }

  async createBuilding(payload: { name: string; campusId: string; code?: string }): Promise<Building> {
    const res = await fetch(`${this.baseUrl}/admin/locations/buildings`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json", cookie: this.cookie },
      credentials: "include",
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    this.collectSetCookies(res);
    return this.parseOrThrow<Building>(res);
  }

  async updateBuilding(
    id: string,
    patch: { name?: string; campusId?: string; code?: string; active?: boolean }
  ): Promise<Building> {
    const method = patch.active !== undefined ? "PATCH" : "PUT";
    const res = await fetch(`${this.baseUrl}/admin/locations/buildings/${encodeURIComponent(id)}`, {
      method,
      headers: { "content-type": "application/json", accept: "application/json", cookie: this.cookie },
      credentials: "include",
      body: JSON.stringify(patch),
      cache: "no-store",
    });
    this.collectSetCookies(res);
    return this.parseOrThrow<Building>(res);
  }

  async deleteBuilding(id: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/admin/locations/buildings/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { cookie: this.cookie, accept: "application/json" },
      credentials: "include",
      cache: "no-store",
    });
    this.collectSetCookies(res);
    await this.parseOrThrow<void>(res);
  }

  async reactivateBuilding(id: string): Promise<Building> {
    const res = await fetch(`${this.baseUrl}/admin/locations/buildings/${encodeURIComponent(id)}/reactivate`, {
      method: "POST",
      headers: { cookie: this.cookie, accept: "application/json" },
      credentials: "include",
      cache: "no-store",
    });
    this.collectSetCookies(res);
    return this.parseOrThrow<Building>(res);
  }


  //  ROOMS 
  async listRooms(params?: { buildingId?: string }): Promise<Room[]> {
    const url = new URL(`${this.baseUrl}/admin/locations/rooms`);
    url.searchParams.set("page", "1");
    url.searchParams.set("limit", "10000");
    if (params?.buildingId) url.searchParams.set("buildingId", params.buildingId);

    const res = await fetch(url, {
      method: "GET",
      headers: { cookie: this.cookie, accept: "application/json" },
      credentials: "include",
      cache: "no-store",
    });
    this.collectSetCookies(res);
    const data = await this.parseOrThrow<any>(res);
    return this.toArray<Room>(data);
  }

  async createRoom(payload: {
    name: string; buildingId: string; number: string; type: string; capacity: number;
  }): Promise<Room> {
    const res = await fetch(`${this.baseUrl}/admin/locations/rooms`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json", cookie: this.cookie },
      credentials: "include",
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    this.collectSetCookies(res);
    return this.parseOrThrow<Room>(res);
  }

  async updateRoom(
    id: string,
    patch: { name?: string; buildingId?: string; number?: string; type?: string; capacity?: number; active?: boolean; }
  ): Promise<Room> {
    const method = patch.active !== undefined ? "PATCH" : "PUT";
    const res = await fetch(`${this.baseUrl}/admin/locations/rooms/${encodeURIComponent(id)}`, {
      method,
      headers: { "content-type": "application/json", accept: "application/json", cookie: this.cookie },
      credentials: "include",
      body: JSON.stringify(patch),
      cache: "no-store",
    });
    this.collectSetCookies(res);
    return this.parseOrThrow<Room>(res);
  }

  async deleteRoom(id: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/admin/locations/rooms/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { cookie: this.cookie, accept: "application/json" },
      credentials: "include",
      cache: "no-store",
    });
    this.collectSetCookies(res);
    await this.parseOrThrow<void>(res);
  }

  async reactivateRoom(id: string): Promise<Room> {
    const res = await fetch(`${this.baseUrl}/admin/locations/rooms/${encodeURIComponent(id)}/reactivate`, {
      method: "POST",
      headers: { cookie: this.cookie, accept: "application/json" },
      credentials: "include",
      cache: "no-store",
    });
    this.collectSetCookies(res);
    return this.parseOrThrow<Room>(res);
  }


  //  PAGINADOS 

  async listCampusPage(params?: {
    page?: number; limit?: number; q?: string; active?: boolean;
  }): Promise<Page<Campus, CampusStats>> {
    const url = new URL(`${this.baseUrl}/admin/locations/campus`);
    if (params?.page)  url.searchParams.set("page", String(params.page));
    if (params?.limit) url.searchParams.set("limit", String(params.limit));
    if (params?.q)     url.searchParams.set("q", params.q);
    if (params?.active !== undefined) url.searchParams.set("active", String(params.active));

    const res = await fetch(url, {
      method: "GET",
      headers: { cookie: this.cookie, accept: "application/json" },
      credentials: "include",
      cache: "no-store",
    });
    this.collectSetCookies(res);
    return this.parseOrThrow<Page<Campus, CampusStats>>(res);
  }

  async listBuildingsPage(params?: {
    campusId?: string; page?: number; limit?: number; q?: string; active?: boolean;
  }): Promise<Page<Building, BuildingStats>> {
    const url = new URL(`${this.baseUrl}/admin/locations/buildings`);
    if (params?.campusId) url.searchParams.set("campusId", params.campusId);
    if (params?.page)     url.searchParams.set("page", String(params.page));
    if (params?.limit)    url.searchParams.set("limit", String(params.limit));
    if (params?.q)        url.searchParams.set("q", params.q || "");
    if (params?.active !== undefined) url.searchParams.set("active", String(params.active));

    const res = await fetch(url, {
      method: "GET",
      headers: { cookie: this.cookie, accept: "application/json" },
      credentials: "include",
      cache: "no-store",
    });
    this.collectSetCookies(res);
    return this.parseOrThrow<Page<Building, BuildingStats>>(res);
  }

  async listRoomsPage(params?: {
    buildingId?: string; page?: number; limit?: number; q?: string; active?: boolean;
  }): Promise<Page<Room, RoomStats>> {
    const url = new URL(`${this.baseUrl}/admin/locations/rooms`);
    if (params?.buildingId) url.searchParams.set("buildingId", params.buildingId);
    if (params?.page)       url.searchParams.set("page", String(params.page));
    if (params?.limit)      url.searchParams.set("limit", String(params.limit));
    if (params?.q)          url.searchParams.set("q", params.q || "");
    if (params?.active !== undefined) url.searchParams.set("active", String(params.active));

    const res = await fetch(url, {
      method: "GET",
      headers: { cookie: this.cookie, accept: "application/json" },
      credentials: "include",
      cache: "no-store",
    });
    this.collectSetCookies(res);
    return this.parseOrThrow<Page<Room, RoomStats>>(res);
  }
}
