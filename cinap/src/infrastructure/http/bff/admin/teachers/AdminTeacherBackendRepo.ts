import type { TeachersRepo } from "@/application/admin/teachers/ports/TeachersRepo";
import type { Teacher, TeacherId, TeacherPage } from "@/domain/admin/teachers";

export class AdminTeachersBackendRepo implements TeachersRepo {
  private readonly baseUrl: string;
  private readonly cookie: string;
  private setCookies: string[] = [];

  constructor(cookie: string) {
    this.baseUrl =
      process.env.BACKEND_URL ??
      "";
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
        : (res.headers.get("set-cookie")
            ? [res.headers.get("set-cookie") as string]
            : []);
    this.setCookies.push(...rawList);
  }

  private async parse<T>(res: Response): Promise<T> {
    this.collectSetCookies(res);
    const txt = await res.text();
    try { return JSON.parse(txt) as T; } catch { throw new Error(txt || `HTTP ${res.status}`); }
  }

  private mapBackendTeacher(row: any): Teacher {
    return {
      id: row.id ?? "",
      name: row.name ?? "",
      email: row.email ?? "",
    };
  }

  async list(params: { page?: number; limit?: number; query?: string } = {}): Promise<TeacherPage> {
    const { page = 1, limit = 20, query } = params;
    const qs = new URLSearchParams();
    qs.set("page", String(page));
    qs.set("limit", String(limit));
    if (query) qs.set("q", query);

    const res = await fetch(`${this.baseUrl}/api/admin/teachers/?${qs.toString()}`, {
      method: "GET",
      headers: { cookie: this.cookie, accept: "application/json" },
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) throw new Error((await res.text()) || "No se pudieron cargar los docentes");
    const data = await this.parse<any>(res);
    const items = Array.isArray(data?.items) ? data.items : [];
    return {
      items: items.map((row: any) => this.mapBackendTeacher(row)),
      page: data?.page ?? page,
      perPage: data?.per_page ?? limit,
      total: data?.total ?? items.length,
      pages: data?.pages ?? 1,
    };
  }

  async update(teacher: Teacher): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/admin/teachers/${teacher.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json", accept: "application/json", cookie: this.cookie },
      credentials: "include",
      body: JSON.stringify({ name: teacher.name, email: teacher.email }),
      cache: "no-store",
    });
    if (!res.ok) throw new Error((await res.text()) || "No se pudo actualizar el docente");
    this.collectSetCookies(res);
  }

  async delete(id: TeacherId): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/admin/teachers/${id}`, {
      method: "DELETE",
      headers: { accept: "application/json", cookie: this.cookie },
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) throw new Error((await res.text()) || "No se pudo eliminar el docente");
    this.collectSetCookies(res);
  }
}
