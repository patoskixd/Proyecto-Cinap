// infrastructure/http/bff/admin/catalog/AdminCatalogBackendRepo.ts
import type { AdminCatalogRepo } from "@/application/admin/catalog/ports/AdminCatalogRepo";
import type { AdminCategory, AdminService } from "@/domain/admin/catalog";

export class HttpError extends Error {
  status: number;
  detail?: string;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.detail = message;
  }
}

export class AdminCatalogBackendRepo implements AdminCatalogRepo {
  private lastSetCookies: string[] = [];
  private readonly baseUrl: string;
  private readonly cookie: string;

  constructor(cookie: string) {
    this.baseUrl = process.env.BACKEND_URL || "http://localhost:8000";
    this.cookie = cookie;
  }

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

  // ===== Helpers (mismo patrón de locations) =====
  private async parseOrThrow<T>(res: Response): Promise<T> {
  const raw = await res.text();
  let data: any = null;
  try { data = raw ? JSON.parse(raw) : null; } catch { data = raw; }

  if (!res.ok) {
    // Normalizar detalle: si viene como objeto, tomar su .message
    let msg: string = `HTTP ${res.status}`;
    if (data) {
      const d = (data.detail ?? data.message ?? data);
      if (typeof d === "string") {
        msg = d;
      } else if (d && typeof d === "object") {
        msg = d.message ?? JSON.stringify(d);
      }
    }
    throw new Error(msg);
  }
  return data as T;
}


  // ---------- Categorías
  async listCategories(): Promise<AdminCategory[]> {
    const res = await fetch(`${this.baseUrl}/admin/catalog/categories`, {
      method: "GET",
      headers: { cookie: this.cookie, accept: "application/json" },
      credentials: "include",
      cache: "no-store",
    });
    this.collectSetCookies(res);
    return this.parseOrThrow<AdminCategory[]>(res);
  }

  async createCategory(payload: { name: string; description: string }): Promise<AdminCategory> {
    const res = await fetch(`${this.baseUrl}/admin/catalog/categories`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json", cookie: this.cookie },
      credentials: "include",
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    this.collectSetCookies(res);
    return this.parseOrThrow<AdminCategory>(res);
  }

  async updateCategory(
    id: string,
    patch: { name?: string; description?: string; active?: boolean }
  ): Promise<AdminCategory> {
    const res = await fetch(`${this.baseUrl}/admin/catalog/categories/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "content-type": "application/json", accept: "application/json", cookie: this.cookie },
      credentials: "include",
      body: JSON.stringify(patch),
      cache: "no-store",
    });
    this.collectSetCookies(res);
    return this.parseOrThrow<AdminCategory>(res);
  }

  async deleteCategory(id: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/admin/catalog/categories/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { cookie: this.cookie, accept: "application/json" },
      credentials: "include",
      cache: "no-store",
    });
    this.collectSetCookies(res);
    return this.parseOrThrow<void>(res);
  }

  async reactivateCategory(id: string): Promise<AdminCategory> {
    const res = await fetch(`${this.baseUrl}/admin/catalog/categories/${encodeURIComponent(id)}/reactivate`, {
      method: "POST",
      headers: { cookie: this.cookie, accept: "application/json" },
      credentials: "include",
      cache: "no-store",
    });
    this.collectSetCookies(res);
    return this.parseOrThrow<AdminCategory>(res);
  }

  // ---------- Servicios
  async createService(
    categoryId: string,
    payload: { name: string; durationMinutes: number; active?: boolean }
  ): Promise<AdminService> {
    const res = await fetch(`${this.baseUrl}/admin/catalog/categories/${encodeURIComponent(categoryId)}/services`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json", cookie: this.cookie },
      credentials: "include",
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    this.collectSetCookies(res);
    return this.parseOrThrow<AdminService>(res);
  }

  async updateService(
    id: string,
    patch: { name?: string; durationMinutes?: number; active?: boolean }
  ): Promise<AdminService> {
    const res = await fetch(`${this.baseUrl}/admin/catalog/services/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "content-type": "application/json", accept: "application/json", cookie: this.cookie },
      credentials: "include",
      body: JSON.stringify(patch),
      cache: "no-store",
    });
    this.collectSetCookies(res);
    return this.parseOrThrow<AdminService>(res);
  }

  async deleteService(id: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/admin/catalog/services/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { cookie: this.cookie, accept: "application/json" },
      credentials: "include",
      cache: "no-store",
    });
    this.collectSetCookies(res);
    return this.parseOrThrow<void>(res);
  }

  async reactivateService(id: string): Promise<AdminService> {
    const res = await fetch(`${this.baseUrl}/admin/catalog/services/${encodeURIComponent(id)}/reactivate`, {
      method: "POST",
      headers: { cookie: this.cookie, accept: "application/json" },
      credentials: "include",
      cache: "no-store",
    });
    this.collectSetCookies(res);
    return this.parseOrThrow<AdminService>(res);
  }
}
