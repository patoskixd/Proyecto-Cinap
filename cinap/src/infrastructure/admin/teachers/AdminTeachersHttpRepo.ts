import type { TeachersRepo } from "@/application/admin/teachers/ports/TeachersRepo";
import type { Teacher, TeacherPage } from "@/domain/admin/teachers";

export class HttpTeachersRepo implements TeachersRepo {
  private base = "/api/admin/teachers";

  async list(params: { page?: number; limit?: number; query?: string } = {}): Promise<TeacherPage> {
    const { page = 1, limit = 20, query } = params;
    const qs = new URLSearchParams();
    qs.set("page", String(page));
    qs.set("limit", String(limit));
    if (query) qs.set("q", query);

    const res = await fetch(`${this.base}?${qs.toString()}`, { method: "GET", cache: "no-store", credentials: "include" });
    if (!res.ok) throw new Error((await res.text()) || "No se pudieron cargar los docentes");
    const data = await res.json();
    const items = Array.isArray(data?.items) ? data.items : [];
    return {
      items: items.map((t: any) => ({ id: t.id, name: t.name, email: t.email } as Teacher)),
      page: data?.page ?? page,
      perPage: data?.per_page ?? limit,
      total: data?.total ?? items.length,
      pages: data?.pages ?? 1,
    };
  }

  async update(teacher: Teacher): Promise<void> {
    const res = await fetch(`${this.base}/${teacher.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name: teacher.name, email: teacher.email }),
    });
    if (!res.ok) throw new Error(await res.text() || "No se pudo actualizar el docente");
  }

  async delete(id: string): Promise<void> {
    const res = await fetch(`${this.base}/${id}`, { method: "DELETE", credentials: "include" });
    if (!res.ok) throw new Error(await res.text() || "No se pudo eliminar el docente");
  }
}
