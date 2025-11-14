import type { AdvisorCatalogQueryRepo } from "@/application/advisor/catalog/ports/AdvisorCatalogRepo";
import type { AdvisorCatalog } from "@/domain/advisor/catalog";

export class AdvisorCatalogBackendRepo implements AdvisorCatalogQueryRepo {
  private lastSetCookies: string[] = [];
  private readonly baseUrl: string;
  private readonly cookie: string;

  constructor(cookie: string) {
    this.baseUrl =
      process.env.BACKEND_URL ??
      "";
    this.cookie = cookie ?? "";
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

  async list(): Promise<AdvisorCatalog> {
    const res = await fetch(`${this.baseUrl}/api/advisor/catalog`, {
      method: "GET",
      headers: { cookie: this.cookie, accept: "application/json" },
      credentials: "include",
      cache: "no-store",
    });

    this.collectSetCookies(res);
    if (!res.ok) throw new Error(await res.text() || "No se pudo cargar el catálogo del asesor");

    return this.parse<AdvisorCatalog>(res);
  }
}
