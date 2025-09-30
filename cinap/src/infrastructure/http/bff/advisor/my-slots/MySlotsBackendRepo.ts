import type { MySlotsRepo } from "@application/my-slots/ports/MySlotsRepo";
import type { MySlot } from "@domain/mySlots";

export class MySlotsBackendRepo implements MySlotsRepo {
  constructor(private baseUrl: string, private cookie: string) {}

  private async json<T>(res: Response): Promise<T> {
    const txt = await res.text();
    try { return JSON.parse(txt) as T; } catch { throw new Error(txt || `HTTP ${res.status}`); }
  }

  async getMySlots(): Promise<MySlot[]> {
    const res = await fetch(`${this.baseUrl}/slots/my`, {
      headers: { cookie: this.cookie, accept: "application/json" },
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) throw new Error(await res.text());
    return this.json<MySlot[]>(res);
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
