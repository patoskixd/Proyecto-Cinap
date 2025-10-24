import type { Reservation } from "@/domain/reservation";
import type { ReservationListFilters, ReservationListParams, ReservationListResult } from "@/application/teacher/asesorias/ports/ReservationsRepo";

type BackendReservation = {
  id: string;
  status: string;
  inicio: string;
  fin: string;
  servicio: {
    id: string;
    nombre: string;
    categoria: {
      id: string;
      nombre: string;
    };
  };
  duracionMinutos: number | null;
  asesor: {
    id: string | null;
    nombre: string | null;
    email: string | null;
  } | null;
  docente?: {
    nombre: string;
    email: string;
  };
  location?: string | null;
};

type BackendMeta = {
  page: number;
  pages: number;
  total: number;
  role: string;
  capabilities: {
    canCancel: boolean;
    canConfirm: boolean;
  };
};

type BackendListResponse = {
  success: boolean;
  data: BackendReservation[];
  meta: BackendMeta;
};

export class ReservationsBackendRepo {
  private lastSetCookies: string[] = [];
  private readonly baseUrl: string;
  private readonly cookie: string;

  constructor(cookieHeader: string) {
    this.baseUrl =
      process.env.BACKEND_URL ??
      "";
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
        : res.headers.get("set-cookie")
        ? [res.headers.get("set-cookie") as string]
        : [];
    this.lastSetCookies.push(...raw);
  }

  private async parse<T>(res: Response): Promise<T> {
    const txt = await res.text();
    try {
      return JSON.parse(txt) as T;
    } catch {
      throw new Error(txt || `HTTP ${res.status}`);
    }
  }

  private slugify(value: string): string {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  private advisorInitials(name: string | null | undefined): string {
    if (!name) return "??";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "??";
    const [first, second] = parts;
    const initials = [first, second].filter(Boolean).map((part) => part[0]?.toUpperCase() ?? "").join("");
    return initials || "??";
  }

  private formatDay(date: Date | null): string {
    if (!date || Number.isNaN(date.getTime())) return "--";
    return new Intl.DateTimeFormat("es-CL", { day: "2-digit" }).format(date);
  }

  private formatMonth(date: Date | null): string {
    if (!date || Number.isNaN(date.getTime())) return "--";
    return new Intl.DateTimeFormat("es-CL", { month: "short" })
      .format(date)
      .replace(".", "")
      .toUpperCase();
  }

  private formatTime(date: Date | null): string {
    if (!date || Number.isNaN(date.getTime())) return "--:--";
    return new Intl.DateTimeFormat("es-CL", {
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  }

  private durationLabel(minutes: number | null, start: Date | null, end: Date | null): string {
    if (typeof minutes === "number" && minutes > 0) {
      return `${minutes} min`;
    }

    if (start && end) {
      const diffMs = end.getTime() - start.getTime();
      if (Number.isFinite(diffMs) && diffMs > 0) {
        const diffMin = Math.round(diffMs / 60000);
        if (diffMin > 0) return `${diffMin} min`;
      }
    }

    return "--";
  }

  private buildQuery(params: ReservationListParams): string {
    const search = new URLSearchParams();
    search.set("kind", params.tab);
    search.set("page", String(params.page));
    search.set("limit", String(params.limit));

    const filters = params.filters ?? {};
    const applyFilter = (key: keyof ReservationListFilters, paramName: string) => {
      const value = filters[key];
      if (value) search.set(paramName, value);
    };

    applyFilter("status", "status");
    applyFilter("category", "category");
    applyFilter("service", "service");
    applyFilter("advisor", "advisor");
    applyFilter("dateFrom", "dateFrom");

    return search.toString();
  }

  private mapReservation(item: BackendReservation): Reservation {
    const start = new Date(item.inicio);
    const end = new Date(item.fin);

    const serviceName = item.servicio?.nombre ?? "Asesoria";
    const categoryName = item.servicio?.categoria?.nombre ?? serviceName;

    const advisor = item.asesor ?? null;

    const normalizedStatus = (item.status ?? "pendiente").toLowerCase();
    const status: Reservation["status"] =
      normalizedStatus === "completada"
        ? "completada"
        : normalizedStatus === "confirmada"
        ? "confirmada"
        : normalizedStatus === "cancelada"
        ? "cancelada"
        : "pendiente";

    return {
      id: item.id,
      dateISO: item.inicio,
      day: this.formatDay(start),
      month: this.formatMonth(start),
      time: this.formatTime(start),
      endTime: this.formatTime(end),
      duration: this.durationLabel(item.duracionMinutos, start, end),
      serviceTitle: serviceName,
      category: this.slugify(categoryName),
      categoryLabel: categoryName,
      service: this.slugify(serviceName),
      advisor: {
        id: advisor?.id ?? undefined,
        name: advisor?.nombre ?? "Sin asignar",
        email: advisor?.email ?? "sin-correo@cinap.cl",
        initials: this.advisorInitials(advisor?.nombre),
      },
      status,
      location: item.location ?? undefined,
      docente: item.docente,
    };
  }

  async list(params: ReservationListParams): Promise<ReservationListResult> {
    const query = this.buildQuery(params);
    const res = await fetch(`${this.baseUrl}/api/asesorias?${query}`, {
      method: "GET",
      headers: {
        cookie: this.cookie,
        accept: "application/json",
      },
      credentials: "include",
      cache: "no-store",
    });

    this.collectSetCookies(res);
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || `No se pudo obtener la lista de asesorías (HTTP ${res.status})`);
    }

    const payload = await this.parse<BackendListResponse>(res);
    if (!payload.success) {
      throw new Error("Respuesta inesperada del backend de asesorías");
    }

    const items = (payload.data ?? []).map((item) => this.mapReservation(item));

    return {
      items,
      page: payload.meta.page,
      pages: payload.meta.pages,
      total: payload.meta.total,
      capabilities: payload.meta.capabilities,
    };
  }

  async cancel(id: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/asesorias/${id}/cancel`, {
      method: "POST",
      headers: {
        cookie: this.cookie,
        accept: "application/json",
      },
      credentials: "include",
      cache: "no-store",
    });

    this.collectSetCookies(res);
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || `No se pudo cancelar la asesoría (HTTP ${res.status})`);
    }
  }

  async confirm(id: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/asesorias/${id}/confirm`, {
      method: "POST",
      headers: {
        cookie: this.cookie,
        accept: "application/json",
      },
      credentials: "include",
      cache: "no-store",
    });

    this.collectSetCookies(res);
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || `No se pudo confirmar la asesoría (HTTP ${res.status})`);
    }
  }
}

