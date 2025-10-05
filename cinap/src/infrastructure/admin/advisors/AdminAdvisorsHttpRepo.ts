"use client";

import type { AdminAdvisorRepo } from "@/application/admin/advisors/ports/AdminAdvisorRepo";
import type { 
  Advisor, 
  AdvisorId, 
  RegisterAdvisorRequest, 
  UpdateAdvisorRequest
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

export class AdminAdvisorsHttpRepo implements AdminAdvisorRepo {
  private baseUrl: string;

  constructor(baseUrl = "/api/admin/advisors") {
    this.baseUrl = baseUrl;
  }

  async list(): Promise<Advisor[]> {
    const response = await fetch(this.baseUrl, {
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

    return parse<Advisor[]>(response);
  }

  async add(request: RegisterAdvisorRequest): Promise<Advisor> {
    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error((await response.text()) || "No se pudo registrar el asesor");
    }

    return parse<Advisor>(response);
  }

  async update(id: AdvisorId, changes: UpdateAdvisorRequest): Promise<Advisor> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(changes),
    });

    if (!response.ok) {
      throw new Error((await response.text()) || "No se pudo actualizar el asesor");
    }

    return parse<Advisor>(response);
  }

  async remove(id: AdvisorId): Promise<Advisor> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: "DELETE",
      headers: {
        "Accept": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error((await response.text()) || "No se pudo eliminar el asesor");
    }

    return parse<Advisor>(response);
  }
}
