import type { AdminCatalogRepo } from "@application/admin-catalog/ports/AdminCatalogRepo";
import type { AdminCategory, AdminService } from "@domain/adminCatalog";

export class AdminCatalogBackendRepo implements AdminCatalogRepo {
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

  // ---------- Categorías
  async listCategories(): Promise<AdminCategory[]> {
    const res = await fetch(`${this.baseUrl}/admin/catalog/categories`, {
      method: "GET",
      headers: { cookie: this.cookie, accept: "application/json" },
      credentials: "include",
      cache: "no-store",
    });
    this.collectSetCookies(res);
    if (!res.ok) throw new Error(await res.text() || "No se pudieron cargar las categorías");
    return this.parse<AdminCategory[]>(res);
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
    const data = await this.parse<any>(res);
    if (!res.ok) throw new Error(data?.detail || data?.message || "No se pudo crear la categoría");
    return data as AdminCategory;
  }

  async updateCategory(
    id: string,
    patch: { name?: string; description?: string; active?: boolean }
  ): Promise<AdminCategory> {
    const res = await fetch(`${this.baseUrl}/admin/catalog/categories/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json", accept: "application/json", cookie: this.cookie },
      credentials: "include",
      body: JSON.stringify(patch),
      cache: "no-store",
    });
    this.collectSetCookies(res);
    const data = await this.parse<any>(res);
    if (!res.ok) throw new Error(data?.detail || data?.message || "No se pudo actualizar la categoría");
    return data as AdminCategory;
  }

  async deleteCategory(id: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/admin/catalog/categories/${id}`, {
      method: "DELETE",
      headers: { cookie: this.cookie, accept: "application/json" },
      credentials: "include",
      cache: "no-store",
    });
    this.collectSetCookies(res);
    if (!res.ok) throw new Error(await res.text() || "No se pudo eliminar la categoría");
  }

  async reactivateCategory(id: string): Promise<AdminCategory> {
    const res = await fetch(`${this.baseUrl}/admin/catalog/categories/${id}/reactivate`, {
      method: "POST",
      headers: { cookie: this.cookie, accept: "application/json" },
      credentials: "include",
      cache: "no-store",
    });
    this.collectSetCookies(res);
    const data = await this.parse<any>(res);
    if (!res.ok) throw new Error(data?.detail || data?.message || "No se pudo reactivar la categoría");
    return data as AdminCategory;
  }

  // ---------- Servicios
  async createService(
    categoryId: string,
    payload: { name: string; durationMinutes: number; active?: boolean }
  ): Promise<AdminService> {
    const res = await fetch(`${this.baseUrl}/admin/catalog/categories/${categoryId}/services`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json", cookie: this.cookie },
      credentials: "include",
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    this.collectSetCookies(res);
    const data = await this.parse<any>(res);
    if (!res.ok) throw new Error(data?.detail || data?.message || "No se pudo crear el servicio");
    return data as AdminService;
  }

  async updateService(
    id: string,
    patch: { name?: string; durationMinutes?: number; active?: boolean }
  ): Promise<AdminService> {
    const res = await fetch(`${this.baseUrl}/admin/catalog/services/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json", accept: "application/json", cookie: this.cookie },
      credentials: "include",
      body: JSON.stringify(patch),
      cache: "no-store",
    });
    this.collectSetCookies(res);
    const data = await this.parse<any>(res);
    if (!res.ok) throw new Error(data?.detail || data?.message || "No se pudo actualizar el servicio");
    return data as AdminService;
  }

  async deleteService(id: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/admin/catalog/services/${id}`, {
      method: "DELETE",
      headers: { cookie: this.cookie, accept: "application/json" },
      credentials: "include",
      cache: "no-store",
    });
    this.collectSetCookies(res);
    if (!res.ok) throw new Error(await res.text() || "No se pudo eliminar el servicio");
  }

  async reactivateService(id: string): Promise<AdminService> {
    const res = await fetch(`${this.baseUrl}/admin/catalog/services/${id}/reactivate`, {
      method: "POST",
      headers: { cookie: this.cookie, accept: "application/json" },
      credentials: "include",
      cache: "no-store",
    });
    this.collectSetCookies(res);
    const data = await this.parse<any>(res);
    if (!res.ok) throw new Error(data?.detail || data?.message || "No se pudo reactivar el servicio");
    return data as AdminService;
  }
}
