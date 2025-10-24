import type { ConfirmationsRepo } from "@/application/advisor/confirmations/ports/ConfirmationsRepo";
import type { PendingConfirmation } from "@/domain/advisor/confirmations";

export class ConfirmationsBackendRepo implements ConfirmationsRepo {
  private readonly baseUrl: string;
  private readonly cookie: string;
  private lastSetCookies: string[] = [];

  getSetCookies(): string[] {
    return this.lastSetCookies;
  }

  constructor(cookie: string) {
    this.baseUrl = process.env.BACKEND_URL ??
      "";
    this.cookie = cookie;
  }

  private async parse<T>(res: Response): Promise<T> {
    const txt = await res.text();
    try { return JSON.parse(txt) as T; } catch { throw new Error(txt || `HTTP ${res.status}`); }
  }

  async getPending(): Promise<PendingConfirmation[]> {
    const res = await fetch(`${this.baseUrl}/api/advisor/confirmations/pending`, {
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
