import type { DashboardRepo, DashboardData, DashboardInput } from "@/application/dashboard/ports/DashboardRepo";
import type { Role } from "@/domain/auth";

export class DashboardBackendRepo implements DashboardRepo {
  private lastSetCookies: string[] = [];
  private readonly baseUrl: string;
  private readonly cookie: string;

  constructor(cookie: string) {
    this.baseUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL ??
      process.env.BACKEND_URL ??
      "http://localhost:8000";
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

  async getDashboard({ role, userId }: DashboardInput): Promise<DashboardData> {
    // Mapear roles del frontend al backend
    const roleMap: Record<Role, string> = {
      'admin': 'Admin',
      'advisor': 'Asesor', 
      'teacher': 'Profesor'
    };

    const backendRole = roleMap[role];
    if (!backendRole) {
      throw new Error(`Rol no válido: ${role}`);
    }

    // Llamar al nuevo endpoint unificado /dashboard
    const url = new URL(`${this.baseUrl}/dashboard`);
    // No enviar el role como query parameter, dejar que el backend lo obtenga del JWT
    // if (backendRole) {
    //   url.searchParams.set("role", backendRole);
    // }

    const res = await fetch(url, {
      method: "GET", 
      headers: { 
        cookie: this.cookie, 
        accept: "application/json",
        "Content-Type": "application/json"
      },
      credentials: "include",
      cache: "no-store",
    });

    this.collectSetCookies(res);
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || `HTTP ${res.status}: No se pudo cargar dashboard`);
    }

    // Parsear respuesta del backend
    const backendResponse = await this.parse<{
      success: boolean;
      data: any;
      role: string;
      user_id?: string;
    }>(res);

    if (!backendResponse.success) {
      throw new Error("Error en la respuesta del servidor");
    }

    const { data } = backendResponse;

    // Transformar respuesta según el rol
    if (role === "admin") {
      const adminMetrics = {
        advisorsTotal: data.advisorsTotal ?? 0,
        teachersTotal: data.teachersTotal ?? 0,
        appointmentsThisMonth: data.appointmentsThisMonth ?? 0,
        pendingCount: data.pendingCount ?? 0,
        activeCategories: data.activeCategories ?? 0,
        activeServices: data.activeServices ?? 0,
      };

      return {
        upcoming: [],
        drafts: [],
        monthCount: adminMetrics.appointmentsThisMonth,
        pendingCount: 0, // Para admin no necesitamos pendingCount específico
        isCalendarConnected: true,
        adminMetrics,
      };
    }

    if (role === "advisor") {
      return {
        upcoming: data.nextAppointments?.map((apt: any) => ({
          id: apt.id,
          title: apt.servicio || "Asesoría",
          start: apt.inicio,
          end: apt.fin,
          studentName: apt.docente || "Docente",
          location: "Por definir",
          status: "confirmed" as const
        })) ?? [],
        drafts: [],
        monthCount: data.monthCount ?? 0,
        pendingCount: data.pendingCount ?? 0,
        isCalendarConnected: true,
      };
    }

    if (role === "teacher") {
      return {
        upcoming: [],
        drafts: [],
        monthCount: data.monthCount ?? 0, // Ahora usar monthCount del backend
        pendingCount: data.pendingCount ?? 0,
        isCalendarConnected: true,
      };
    }

    throw new Error(`Rol no implementado: ${role}`);
  }
}
