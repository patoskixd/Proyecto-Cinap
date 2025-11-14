"use client";
import type { DashboardRepo, DashboardData, DashboardInput } from "@/application/dashboard/ports/DashboardRepo";

type BackendApt = {
  id?: string;
  inicio?: string;
  fin?: string;
  servicio?: string;
  docente?: string | null;
  asesor?: string | null;
  ubicacion?: string | null;
  location?: string | null;
  estado?: string;
};

function toTime(iso?: string) {
  if (!iso) return "--:--";
  try {
    return new Date(iso).toLocaleTimeString("es-CL", { timeStyle: "short" });
  } catch {
    return "--:--";
  }
}

function toDateLabel(iso?: string) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
    if (same(d, today)) return "Hoy";
    if (same(d, tomorrow)) return "Mañana";
    return d
      .toLocaleDateString("es-CL", { weekday: "short", day: "2-digit" })
      .replace(/\.$/, "");
  } catch {
    return "";
  }
}

function mapBackendAppointments(raw: BackendApt[] | undefined): DashboardData["upcoming"] {
  if (!Array.isArray(raw)) return [];
  return raw.map((a) => {
    const estado = (a.estado ?? "pendiente").toString().toLowerCase();
    return {
      id: a.id ?? "",
      time: toTime(a.inicio),
      dateLabel: toDateLabel(a.inicio),
      title: a.servicio ?? "Asesoría",
      teacherName: a.docente ?? undefined,
      advisorName: a.asesor ?? undefined,
      status: estado.includes("confirm") ? "confirmada" : "pendiente",
      location: a.ubicacion ?? a.location ?? undefined,
    };
  });
}

function ensureDashboardData(payload: any, roleHint: string | undefined): DashboardData {
  // Case 1: nuevo BFF ya devuelve DashboardData
  if (payload && Array.isArray(payload.upcoming) && typeof payload.monthCount === "number") {
    return {
      upcoming: payload.upcoming,
      monthCount: payload.monthCount ?? 0,
      pendingCount: payload.pendingCount ?? 0,
      isCalendarConnected: Boolean(payload.isCalendarConnected),
      adminMetrics: payload.adminMetrics,
      upcomingTotal: payload.upcomingTotal ?? payload.upcoming?.length ?? 0,
    };
  }

  // Case 2: backend crudo { success, data, role }
  const rawData = payload?.data ?? payload ?? {};
  const roleRaw = (payload?.role ?? roleHint ?? "").toString().trim().toLowerCase();
  const isAdmin = roleRaw === "admin";

  const calendarConnected =
    Boolean(rawData.isCalendarConnected ?? rawData.calendarConnected ?? false);

  const rawAppointments: BackendApt[] = Array.isArray(rawData.nextAppointmentsAll)
    ? rawData.nextAppointmentsAll
    : rawData.nextAppointments;

  const upcoming = mapBackendAppointments(rawAppointments);

  if (isAdmin) {
    const adminMetrics = {
      advisorsTotal: rawData.advisorsTotal ?? rawData?.adminMetrics?.advisorsTotal ?? 0,
      teachersTotal: rawData.teachersTotal ?? rawData?.adminMetrics?.teachersTotal ?? 0,
      appointmentsThisMonth:
        rawData.appointmentsThisMonth ?? rawData?.adminMetrics?.appointmentsThisMonth ?? 0,
      pendingCount: rawData.pendingCount ?? rawData?.adminMetrics?.pendingCount ?? 0,
      activeCategories: rawData.activeCategories ?? rawData?.adminMetrics?.activeCategories ?? 0,
      activeServices: rawData.activeServices ?? rawData?.adminMetrics?.activeServices ?? 0,
    };
    return {
      upcoming,
      monthCount: adminMetrics.appointmentsThisMonth,
      pendingCount: adminMetrics.pendingCount,
      isCalendarConnected: calendarConnected,
      adminMetrics,
      upcomingTotal: rawData.upcomingTotal ?? upcoming.length,
    };
  }

  return {
    upcoming,
    monthCount: rawData.monthCount ?? 0,
    pendingCount: rawData.pendingCount ?? 0,
    isCalendarConnected: calendarConnected,
    upcomingTotal: rawData.upcomingTotal ?? upcoming.length,
  };
}

export class DashboardHttpRepo implements DashboardRepo {
  async getDashboard({ role, userId }: DashboardInput): Promise<DashboardData> {
    const params = new URLSearchParams();
    params.set("role", role);
    if (userId) params.set("userId", userId);

    const res = await fetch(`/api/dashboard?${params.toString()}`, {
      credentials: "include",
      cache: "no-store",
      headers: { accept: "application/json" },
    });
    if (!res.ok) throw new Error(await res.text());

    const txt = await res.text();
    let json: any;
    try {
      json = JSON.parse(txt);
    } catch {
      throw new Error(txt || `HTTP ${res.status}`);
    }

    return ensureDashboardData(json, role);
  }
}
