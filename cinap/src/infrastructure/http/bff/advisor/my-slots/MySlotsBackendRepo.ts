import type { MySlotsRepo } from "@/application/advisor/my-slots/ports/MySlotsRepo";
import type { MySlot } from "@/domain/advisor/mySlots";

export class MySlotsBackendRepo implements MySlotsRepo {
  private readonly baseUrl: string;
  private readonly cookie: string;
  private lastSetCookies: string[] = [];
  getSetCookies(): string[] { return this.lastSetCookies; }

  constructor(cookie: string) {
    this.baseUrl = process.env.BACKEND_URL || "http://localhost:8000";
    this.cookie = cookie;
  }

  private async json<T>(res: Response): Promise<T> {
    const txt = await res.text();
    try { return JSON.parse(txt) as T; } catch { throw new Error(txt || `HTTP ${res.status}`); }
  }

async getMySlotsPage(params: {
    page?: number;
    limit?: number;
    status?: "" | MySlot["status"];
    date?: string;
    category?: string;
    service?: string;
    campus?: string;
  }) {
    const { page = 1, limit = 36, status = "", date, category, service, campus } = params || {};
    const qs = new URLSearchParams();
    qs.set("page", String(page));
    qs.set("limit", String(limit));
    if (status) qs.set("status", status);
    if (date) qs.set("date", date);
    if (category) qs.set("category", category);
    if (service) qs.set("service", service);
    if (campus) qs.set("campus", campus);

    const res = await fetch(`${this.baseUrl}/slots/my?${qs.toString()}`, {
      headers: { cookie: this.cookie, accept: "application/json" },
      credentials: "include",
      cache: "no-store",
    });
    const data = await this.json<any>(res);
    if (!res.ok) throw new Error(data?.detail || "No se pudieron cargar los cupos");
    return data as {
      items: MySlot[];
      page: number; per_page: number; total: number; pages: number;
      stats: { total: number; disponibles: number; ocupadas_min: number };
    };
  }

  async getMySlots(): Promise<MySlot[]> {
    const p = await this.getMySlotsPage({ page: 1, limit: 36 });
    return p.items;
  }

  async updateMySlot(id: string, patch: Partial<MySlot>): Promise<MySlot> {
    const res = await fetch(`${this.baseUrl}/slots/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json", accept: "application/json", cookie: this.cookie },
      credentials: "include",
      body: JSON.stringify(patch),
    });
    const data = await this.json<any>(res);
    if (!res.ok) throw new Error(data?.detail?.message || data?.message || "No se pudo guardar");
    return data as MySlot;
  }

  async deleteMySlot(id: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/slots/${id}`, {
      method: "DELETE",
      headers: { cookie: this.cookie, accept: "application/json" },
      credentials: "include",
    });
    if (!res.ok) throw new Error(await res.text() || "No se pudo eliminar");
  }

  async reactivateMySlot(id: string): Promise<MySlot> {
    const res = await fetch(`${this.baseUrl}/slots/${id}/reactivate`, {
      method: "POST",
      headers: { cookie: this.cookie, accept: "application/json" },
      credentials: "include",
    });
    const data = await this.json<any>(res);
    if (!res.ok) throw new Error(data?.detail || data?.message || "No se pudo reactivar");
    return data as MySlot;
  }
}
