"use client";

import type { AdminAdvisorRepo } from "@/application/admin/advisors/ports/AdminAdvisorRepo";
import type {
  Advisor,
  AdvisorId,
  RegisterAdvisorRequest,
  UpdateAdvisorRequest,
  AdvisorsPage,
} from "@/domain/admin/advisors";

async function parse<T>(res: Response): Promise<T> {
  const txt = await res.text();
  const ct = res.headers.get("content-type") || "";
  const isHtml = ct.includes("text/html");
  if (isHtml)
    throw new Error(
      "Ruta /api/admin/advisors no encontrada (404). Revisa los route.ts y reinicia el dev server."
    );
  try {
    return JSON.parse(txt) as T;
  } catch {
    throw new Error(txt || `HTTP ${res.status}`);
  }
}

function mapToAdvisor(raw: any): Advisor {
  if (!raw) {
    return {
      id: "",
      basic: { name: "", email: "" },
      categories: [],
      services: [],
      active: false,
      createdAt: new Date(0).toISOString(),
    };
  }

  const basic = raw.basic ?? {
    name: raw.name ?? "",
    email: raw.email ?? "",
  };

  return {
    id: raw.id ?? "",
    basic: {
      name: basic.name ?? "",
      email: basic.email ?? "",
    },
    categories: Array.isArray(raw.categories) ? raw.categories.map(String) : [],
    services: Array.isArray(raw.services)
      ? raw.services.map((svc: any) => ({
          id: svc?.id ?? "",
          name: svc?.name ?? "",
          categoryId: svc?.categoryId ?? svc?.category_id ?? "",
          categoryName: svc?.categoryName ?? svc?.category_name ?? "",
        }))
      : [],
    active: raw.active ?? raw.activo ?? false,
    createdAt: raw.createdAt ?? raw.created_at ?? new Date(0).toISOString(),
  };
}

export class AdminAdvisorsHttpRepo implements AdminAdvisorRepo {
  private baseUrl: string;

  constructor(baseUrl = "/api/admin/advisors") {
    this.baseUrl = baseUrl;
  }

  async list(params: { page?: number; limit?: number; query?: string; categoryId?: string; serviceId?: string } = {}): Promise<AdvisorsPage> {
    const { page = 1, limit = 20, query, categoryId, serviceId } = params;
    const qs = new URLSearchParams();
    qs.set("page", String(page));
    qs.set("limit", String(limit));
    if (query) qs.set("q", query);
    if (categoryId) qs.set("category_id", categoryId);
    if (serviceId) qs.set("service_id", serviceId);

    const response = await fetch(`${this.baseUrl}?${qs.toString()}`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error((await response.text()) || "No se pudieron cargar los asesores");
    }

    const data = await parse<any>(response);
    const items = Array.isArray(data?.items) ? (data.items as Advisor[]) : [];
    return {
      items: items.map(mapToAdvisor),
      page: data?.page ?? page,
      perPage: data?.per_page ?? limit,
      total: data?.total ?? items.length,
      pages: data?.pages ?? 1,
    };
  }

  async add(request: RegisterAdvisorRequest): Promise<Advisor> {
    const backendPayload = {
      name: request.basic.name,
      email: request.basic.email,
      service_ids: request.services,
    };

    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(backendPayload),
    });

    const raw = await response.text();
    let payload: any = undefined;
    if (raw) {
      try {
        payload = JSON.parse(raw);
      } catch {
        payload = undefined;
      }
    }

    if (!response.ok) {
      const detail =
        (payload && (payload.detail || payload.message)) ||
        raw ||
        "No se pudo registrar el asesor";
      throw new Error(String(detail).trim());
    }

    if (!payload) {
      throw new Error("Respuesta inválida del backend al registrar asesor");
    }

    return mapToAdvisor(payload);
  }

  async update(id: AdvisorId, changes: UpdateAdvisorRequest): Promise<Advisor> {
    const backendPayload: Record<string, unknown> = {};

    if (changes.basic) {
      if (changes.basic.name !== undefined) backendPayload.name = changes.basic.name;
      if (changes.basic.email !== undefined) backendPayload.email = changes.basic.email;
    }
    if (changes.services) backendPayload.service_ids = changes.services;
    if (changes.active !== undefined) backendPayload.active = changes.active;

    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(backendPayload),
    });

    if (!response.ok) {
      throw new Error((await response.text()) || "No se pudo actualizar el asesor");
    }

    const payload = await parse<any>(response);
    return mapToAdvisor(payload);
  }

  async remove(id: AdvisorId): Promise<Advisor> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: "DELETE",
      headers: {
        "Accept": "application/json",
      },
      credentials: "include",
    });

    const raw = await response.text();
    let payload: any = undefined;
    if (raw) {
      try {
        payload = JSON.parse(raw);
      } catch {
        payload = undefined;
      }
    }

    if (!response.ok) {
      const detail =
        (payload && (payload.detail || payload.message)) ||
        raw ||
        "No se pudo eliminar el asesor";
      throw new Error(String(detail));
    }

    return mapToAdvisor(payload ?? {});
  }
}
