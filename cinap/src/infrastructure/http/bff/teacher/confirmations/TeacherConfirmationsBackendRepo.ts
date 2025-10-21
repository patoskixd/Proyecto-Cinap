import type { TeacherConfirmationsRepo } from "@/application/teacher/confirmations/ports/ConfirmationsRepo";
import type { PendingTeacherConfirmation } from "@/domain/teacher/confirmations";

export class TeacherConfirmationsBackendRepo implements TeacherConfirmationsRepo {
  private lastSetCookies: string[] = [];
  private readonly baseUrl: string;
  private readonly cookie: string;

  constructor(cookieHeader: string) {
    this.baseUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL ??
      process.env.BACKEND_URL ??
      "http://localhost:8000";
    this.cookie = cookieHeader ?? "";
  }

  getSetCookies(): string[] {
    return this.lastSetCookies;
  }

  private collectSetCookies(res: Response) {
    this.lastSetCookies = [];
    const anyHeaders = res.headers as any;
    const raw: string[] =
      typeof anyHeaders.getSetCookie === "function"
        ? anyHeaders.getSetCookie()
        : (res.headers.get("set-cookie") ? [res.headers.get("set-cookie") as string] : []);
    this.lastSetCookies.push(...raw);
  }

  private async parse<T>(res: Response): Promise<T> {
    const txt = await res.text();
    try { return JSON.parse(txt) as T; } catch { throw new Error(txt || `HTTP ${res.status}`); }
  }

  async getPending(): Promise<PendingTeacherConfirmation[]> {
    const res = await fetch(`${this.baseUrl}/teacher/confirmations/pending`, {
      method: "GET",
      headers: { cookie: this.cookie, accept: "application/json" },
      credentials: "include",
      cache: "no-store",
    });

    this.collectSetCookies(res);
    if (!res.ok) throw new Error(await res.text() || "No se pudo cargar confirmaciones del docente");
    return this.parse<PendingTeacherConfirmation[]>(res);
  }
}
