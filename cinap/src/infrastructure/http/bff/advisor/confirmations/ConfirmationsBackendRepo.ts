import type { ConfirmationsRepo } from "@application/confirmations/ports/ConfirmationsRepo";
import type { PendingConfirmation } from "@domain/confirmations";

export class ConfirmationsBackendRepo implements ConfirmationsRepo {
  constructor(
    private readonly baseUrl: string,
    private readonly cookie: string, 
  ) {}

  private async parse<T>(res: Response): Promise<T> {
    const txt = await res.text();
    try { return JSON.parse(txt) as T; } catch { throw new Error(txt || `HTTP ${res.status}`); }
  }

  async getPending(): Promise<PendingConfirmation[]> {
    const res = await fetch(`${this.baseUrl}/advisor/confirmations/pending`, {
      method: "GET",
      headers: { cookie: this.cookie, accept: "application/json" },
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(await res.text() || "No se pudieron cargar las confirmaciones pendientes");
    }
    return this.parse<PendingConfirmation[]>(res);
  }
}
