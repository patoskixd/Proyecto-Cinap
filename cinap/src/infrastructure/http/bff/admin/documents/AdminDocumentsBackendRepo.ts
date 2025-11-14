import type { AdminDocumentsRepo } from "@/application/admin/documents/ports/AdminDocumentsRepo";
import type { AdminDocument, UploadDocumentResponse, DeleteDocumentResponse } from "@/domain/admin/documents";

type AdminDocDTO = {
  id: string;
  name: string;
  url?: string | null;
  kind?: string | null;
  chunks: number;
  created_at?: string;
};

export class AdminDocumentsBackendRepo implements AdminDocumentsRepo {
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

  async list(): Promise<AdminDocument[]> {
    const res = await fetch(`${this.baseUrl}/api/admin/documents`, {
      method: "GET",
      headers: { cookie: this.cookie, accept: "application/json" },
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) throw new Error(await res.text() || "No se pudieron listar documentos");
    const dtos = await this.parse<AdminDocDTO[]>(res);
    return dtos.map((dto) => ({
      id: dto.id,
      name: dto.name,
      url: dto.url,
      kind: dto.kind,
      chunks: dto.chunks,
      createdAt: dto.created_at || new Date().toISOString(),
    }));
  }

  async upload(form: FormData): Promise<UploadDocumentResponse> {
    const res = await fetch(`${this.baseUrl}/api/admin/documents/upload`, {
      method: "POST",
      headers: { cookie: this.cookie },
      body: form,
      credentials: "include",
      cache: "no-store",
    });
    const data = await this.parse<any>(res);
    if (!res.ok) throw new Error(data?.detail || data?.message || "Error al subir documento");
    return {
      ok: data.ok ?? true,
      id: data.id,
      name: data.name,
      inserted: data.inserted,
    };
  }

  async remove(id: string): Promise<DeleteDocumentResponse> {
    const res = await fetch(`${this.baseUrl}/api/admin/documents/${id}`, {
      method: "DELETE",
      headers: { cookie: this.cookie, accept: "application/json" },
      credentials: "include",
      cache: "no-store",
    });
    const data = await this.parse<any>(res);
    if (!res.ok) throw new Error(data?.detail || data?.message || "No se pudo eliminar el documento");
    return {
      ok: data.ok ?? true,
      deleted: data.deleted,
    };
  }
}
