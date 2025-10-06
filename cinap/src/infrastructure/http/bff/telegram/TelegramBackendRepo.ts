import type { TelegramRepo, TelegramMe } from "@application/telegram/ports/TelegramRepo";

export class TelegramBackendRepo implements TelegramRepo {
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

  private async parse<T>(res: Response): Promise<T> {
    const txt = await res.text();
    try { return JSON.parse(txt) as T; } catch { throw new Error(txt || `HTTP ${res.status}`); }
  }

  async link(): Promise<{ url: string }> {
    const res = await fetch(`${this.baseUrl}/telegram/link`, {
      method: "POST",
      headers: { cookie: this.cookie, accept: "application/json", "content-type": "application/json" },
      credentials: "include",
      cache: "no-store",
    });
    this.collectSetCookies(res);
    const data = await this.parse<any>(res);
    if (!res.ok) throw new Error(data?.detail || data?.message || `HTTP ${res.status}`);
    return data as { url: string };
  }

  async me(): Promise<TelegramMe> {
    const res = await fetch(`${this.baseUrl}/telegram/me`, {
      method: "GET",
      headers: { cookie: this.cookie, accept: "application/json" },
      credentials: "include",
      cache: "no-store",
    });
    this.collectSetCookies(res);
    if (!res.ok) {
      console.error(`Backend /telegram/me error: ${res.status}`, await res.text().catch(() => ""));
      if (res.status === 401) {
        return { linked: false };
      }
      throw new Error(`Error al obtener estado de Telegram: ${res.status}`);
    }
    return this.parse<TelegramMe>(res);
  }

  async unlink(): Promise<void> {
    const res = await fetch(`${this.baseUrl}/telegram/link`, {
      method: "DELETE",
      headers: { cookie: this.cookie, accept: "application/json" },
      credentials: "include",
      cache: "no-store",
    });
    this.collectSetCookies(res);
    if (!res.ok) {
      const msg = await res.text().catch(() => "");
      throw new Error(msg || `HTTP ${res.status}`);
    }
  }
}
