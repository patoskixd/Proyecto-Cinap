export type AdminDoc = {
  id: string;
  name: string;
  url?: string | null;
  kind?: string | null;
  chunks: number;
  created_at?: string;
};

export class AdminDocumentsBackendRepo {
  private readonly baseUrl: string;
  private readonly cookie: string;
  private setCookies: string[] = [];

  constructor(cookie: string) {
    this.baseUrl = process.env.BACKEND_URL ?? "";
    this.cookie = cookie ?? "";
  }

  getSetCookies(): string[] {
    return this.setCookies;
  }

  private collectSetCookies(res: Response) {
    this.setCookies = [];
    const anyHeaders = res.headers as any;
    const rawList: string[] =
      typeof anyHeaders.getSetCookie === "function"
        ? anyHeaders.getSetCookie()
        : res.headers.get("set-cookie")
        ? [res.headers.get("set-cookie") as string]
        : [];
    this.setCookies.push(...rawList);
  }

  private async parse<T>(res: Response): Promise<T> {
    this.collectSetCookies(res);
    const txt = await res.text();
    try { return JSON.parse(txt) as T; } catch { throw new Error(txt || `HTTP ${res.status}`); }
  }

  async list(): Promise<AdminDoc[]> {
    const res = await fetch(`${this.baseUrl}/api/admin/documents`, {
      method: "GET",
      headers: { cookie: this.cookie, accept: "application/json" },
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) throw new Error(await res.text() || "No se pudieron listar documentos");
    return this.parse<AdminDoc[]>(res);
  }

  async upload(form: FormData): Promise<{ ok: boolean; id: string; name: string }> {
    const res = await fetch(`${this.baseUrl}/api/admin/documents/upload`, {
      method: "POST",
      headers: { cookie: this.cookie },
      body: form,
      credentials: "include",
      cache: "no-store",
    });
    const data = await this.parse<any>(res);
    if (!res.ok) throw new Error(data?.detail || data?.message || "Error al subir documento");
    return data;
  }

  async remove(id: string): Promise<{ ok: boolean }> {
    const res = await fetch(`${this.baseUrl}/api/admin/documents/${id}`, {
      method: "DELETE",
      headers: { cookie: this.cookie, accept: "application/json" },
      credentials: "include",
      cache: "no-store",
    });
    const data = await this.parse<any>(res);
    if (!res.ok) throw new Error(data?.detail || data?.message || "No se pudo eliminar el documento");
    return data;
  }
}
