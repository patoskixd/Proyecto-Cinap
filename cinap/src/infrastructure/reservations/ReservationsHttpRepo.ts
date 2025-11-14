"use client";

import type {
  ReservationsRepo,
  ReservationListParams,
  ReservationListResult,
} from "@/application/teacher/asesorias/ports/ReservationsRepo";
import type { Reservation } from "@/domain/reservation";

type BackendReservation = {
  id: string;
  status: string;
  inicio: string;
  fin: string;
  servicio?: {
    id?: string;
    nombre?: string;
    categoria?: { id?: string; nombre?: string };
  };
  duracionMinutos?: number | null;
  asesor?: { id?: string | null; nombre?: string | null; email?: string | null } | null;
  docente?: { nombre?: string; email?: string };
  location?: string | null;
  canRetryConfirm?: boolean;
};

type BackendMeta = {
  page: number;
  pages: number;
  total: number;
  capabilities?: { canCancel?: boolean; canConfirm?: boolean };
};

type BackendResponse = {
  success: boolean;
  data: BackendReservation[];
  meta: BackendMeta;
};

function parseJSON(txt: string, status: number): any {
  try {
    return JSON.parse(txt);
  } catch {
    throw new Error(txt || `HTTP ${status}`);
  }
}

function toDate(value?: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDay(date: Date | null): string {
  if (!date) return "--";
  return new Intl.DateTimeFormat("es-CL", { day: "2-digit" }).format(date);
}

function formatMonth(date: Date | null): string {
  if (!date) return "--";
  return new Intl.DateTimeFormat("es-CL", { month: "short" })
    .format(date)
    .replace(".", "")
    .toUpperCase();
}

function formatTime(date: Date | null): string {
  if (!date) return "--:--";
  return new Intl.DateTimeFormat("es-CL", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function durationLabel(minutes: number | null | undefined, start: Date | null, end: Date | null): string {
  if (typeof minutes === "number" && minutes > 0) return `${minutes} min`;
  if (start && end) {
    const diff = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
    if (diff > 0) return `${diff} min`;
  }
  return "--";
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function advisorInitials(name?: string | null): string {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "??";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "??";
}

function normalizeStatus(raw?: string): Reservation["status"] {
  const status = (raw ?? "pendiente").toLowerCase();
  if (status === "confirmada") return "confirmada";
  if (status === "cancelada") return "cancelada";
  if (status === "completada") return "completada";
  return "pendiente";
}

function mapBackendReservation(item: BackendReservation): Reservation {
  const start = toDate(item.inicio);
  const end = toDate(item.fin);
  const serviceName = item.servicio?.nombre ?? "Asesoría";
  const categoryName = item.servicio?.categoria?.nombre ?? serviceName;
  const advisor = item.asesor ?? null;

  return {
    id: item.id,
    dateISO: item.inicio,
    day: formatDay(start),
    month: formatMonth(start),
    time: formatTime(start),
    endTime: formatTime(end),
    duration: durationLabel(item.duracionMinutos ?? null, start, end),
    serviceTitle: serviceName,
    category: slugify(categoryName),
    categoryLabel: categoryName,
    service: slugify(serviceName),
    advisor: {
      id: advisor?.id ?? undefined,
      name: advisor?.nombre ?? "Sin asignar",
      email: advisor?.email ?? "sin-correo@cinap.cl",
      initials: advisorInitials(advisor?.nombre ?? undefined),
    },
    status: normalizeStatus(item.status),
    location: item.location ?? undefined,
    canRetryConfirm: Boolean(item.canRetryConfirm),
    docente: item.docente
      ? {
          nombre: item.docente.nombre ?? "Sin nombre",
          email: item.docente.email ?? "sin-correo@cinap.cl",
        }
      : undefined,
  };
}

function adaptBackendResponse(payload: any): ReservationListResult | null {
  if (!payload || payload?.success !== true || !payload?.meta) return null;

  const backend = payload as BackendResponse;
  const items = Array.isArray(backend.data) ? backend.data.map(mapBackendReservation) : [];
  const caps = backend.meta.capabilities ?? {};

  return {
    items,
    page: backend.meta.page ?? 1,
    pages: backend.meta.pages ?? 1,
    total: backend.meta.total ?? items.length,
    capabilities: {
      canCancel: Boolean(caps.canCancel),
      canConfirm: Boolean(caps.canConfirm),
    },
  };
}

export class ReservationsHttpRepo implements ReservationsRepo {
  async list(params: ReservationListParams): Promise<ReservationListResult> {
    const search = new URLSearchParams();
    search.set("kind", params.tab);
    search.set("page", String(params.page));
    search.set("limit", String(params.limit));

    const filters = params.filters ?? {};
    const set = (key: keyof typeof filters, paramName = key) => {
      const value = filters[key];
      if (value) search.set(String(paramName), value);
    };
    set("status");
    set("category");
    set("service");
    set("advisor");
    set("dateFrom");

    const res = await fetch(`/api/asesorias?${search.toString()}`, {
      credentials: "include",
      cache: "no-store",
      headers: { accept: "application/json" },
    });
    if (!res.ok) {
      throw new Error(await res.text());
    }
    const txt = await res.text();
    const payload = parseJSON(txt, res.status);

    // Si ya viene en el formato del frontend (items/page/etc) lo devolvemos directo.
    if (payload && Array.isArray(payload.items) && typeof payload.total === "number") {
      return payload as ReservationListResult;
    }

    const adapted = adaptBackendResponse(payload);
    if (adapted) return adapted;

    throw new Error("Respuesta inesperada al cargar asesorías");
  }

  async cancel(id: string): Promise<void> {
    const res = await fetch(`/api/asesorias/${id}/cancel`, {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      headers: { accept: "application/json" },
    });
    if (!res.ok) {
      throw new Error(await res.text());
    }
  }

  async confirm(id: string): Promise<void> {
    const res = await fetch(`/api/asesorias/${id}/confirm`, {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      headers: { accept: "application/json" },
    });
    if (!res.ok) {
      throw new Error(await res.text());
    }
  }
}
