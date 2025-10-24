// infrastructure/http/bff/dashboard/DashboardBackendRepo.ts
import type { DashboardRepo, DashboardData, DashboardInput } from "@/application/dashboard/ports/DashboardRepo";

type BackendApt = {
  id: string;
  inicio: string;   // ISO
  fin?: string;     // ISO
  servicio?: string;
  docente?: string | null;
  asesor?: string | null;
  ubicacion?: string | null;
  location?: string | null;
  estado?: "confirmada" | "pendiente" | "CONFIRMADA" | "PENDIENTE";
};

export class DashboardBackendRepo implements DashboardRepo {
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

  // ---- helpers de mapeo ----
  private toTime(iso?: string) {
    if (!iso) return "--:--";
    try { return new Date(iso).toLocaleTimeString("es-CL", { timeStyle: "short" }); } catch { return "--:--"; }
  }

  private toDateLabel(iso?: string) {
    if (!iso) return "";
    const d = new Date(iso);
    const today = new Date();
    const tomorrow = new Date(); tomorrow.setDate(today.getDate() + 1);
    const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
    if (same(d, today)) return "Hoy";
    if (same(d, tomorrow)) return "Mañana";
    return d.toLocaleDateString("es-CL", { weekday: "short", day: "2-digit" })
      .replace(/\.$/, ""); // quita punto en "jue."
  }

  private mapApt(a: BackendApt) {
    const estado = (a.estado ?? "pendiente").toString().toLowerCase();
    const status = estado.includes("confirm") ? "confirmada" as const : "pendiente" as const;

    return {
      id: a.id,
      time: this.toTime(a.inicio),
      dateLabel: this.toDateLabel(a.inicio),
      title: a.servicio ?? "Asesoría",
      // pasamos ambos nombres para que la UI los muestre según rol
      teacherName: a.docente ?? undefined,
      advisorName: a.asesor ?? undefined,
      status,
      location: a.ubicacion ?? a.location ?? "Por definir",
    };
  }

  async getDashboard({ role }: DashboardInput): Promise<DashboardData> {
    const res = await fetch(`${this.baseUrl}/api/dashboard`, {
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

    const backend = await this.parse<{
      success: boolean;
      data: any;
      role: string;
      user_id?: string;
    }>(res);

    if (!backend.success) throw new Error("Error en la respuesta del servidor");
    const data = backend.data ?? {};

    const roleNorm = (backend.role ?? role ?? "").toString().trim().toLowerCase();
    const isAdmin = roleNorm === "admin";

    // SOLO admin puede usar nextAppointmentsAll; el resto usa nextAppointments (filtrado por usuario)
    const rawApts: BackendApt[] = isAdmin
      ? (data.nextAppointmentsAll ?? data.nextAppointments ?? [])
      : (data.nextAppointments ?? []);

    const upcoming = rawApts.map(this.mapApt.bind(this));

    if (isAdmin) {
      const adminMetrics = {
        advisorsTotal: data.advisorsTotal ?? 0,
        teachersTotal: data.teachersTotal ?? 0,
        appointmentsThisMonth: data.appointmentsThisMonth ?? 0,
        pendingCount: data.pendingCount ?? 0,
        activeCategories: data.activeCategories ?? 0,
        activeServices: data.activeServices ?? 0,
      };

      return {
        upcoming,
        monthCount: adminMetrics.appointmentsThisMonth,
        pendingCount: adminMetrics.pendingCount,
        isCalendarConnected: true,
        adminMetrics,
        // Mantén el total que viene del back; sólo si no viene, cae al length
        upcomingTotal: typeof data.upcomingTotal === "number" ? data.upcomingTotal : upcoming.length,
      };
    }

    // Docente/Asesor => SIEMPRE datos personales
    return {
      upcoming,
      monthCount: data.monthCount ?? 0,
      pendingCount: data.pendingCount ?? 0,
      isCalendarConnected: true,
      upcomingTotal: typeof data.upcomingTotal === "number" ? data.upcomingTotal : upcoming.length,
    };
  }
}
