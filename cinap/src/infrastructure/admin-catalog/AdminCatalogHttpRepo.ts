"use client";

import type { AdminCatalogRepo } from "@application/admin-catalog/ports/AdminCatalogRepo";
import type { AdminCategory, AdminService } from "@domain/adminCatalog";

async function parse<T>(res: Response): Promise<T> {
  const txt = await res.text();
  const ct = res.headers.get("content-type") || "";
  const isHtml = ct.includes("text/html");
  if (isHtml)
    throw new Error(
      "Ruta /api/admin/catalog no encontrada (404). Revisa los route.ts y reinicia el dev server."
    );
  try {
    return JSON.parse(txt) as T;
  } catch {
    throw new Error(txt || `HTTP ${res.status}`);
  }
}

export class AdminCatalogHttpRepo implements AdminCatalogRepo {
  // -------- Categorías
  async listCategories(): Promise<AdminCategory[]> {
    const res = await fetch("/api/admin/catalog/categories", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      headers: { accept: "application/json" },
    });
    if (!res.ok)
      throw new Error(
        (await res.text()) || "No se pudieron cargar las categorías"
      );
    return parse<AdminCategory[]>(res);
  }

  async createCategory(payload: {
    name: string;
    description: string;
  }): Promise<AdminCategory> {
    const res = await fetch("/api/admin/catalog/categories", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok)
      throw new Error((await res.text()) || "No se pudo crear la categoría");
    return parse<AdminCategory>(res);
  }

  async updateCategory(
    id: string,
    patch: { name?: string; description?: string; active?: boolean }
  ): Promise<AdminCategory> {
    const res = await fetch(`/api/admin/catalog/categories/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok)
      throw new Error(
        (await res.text()) || "No se pudo actualizar la categoría"
      );
    return parse<AdminCategory>(res);
  }

  async deleteCategory(id: string): Promise<void> {
    const res = await fetch(`/api/admin/catalog/categories/${id}`, {
      method: "DELETE",
      credentials: "include",
      headers: { accept: "application/json" },
    });
    if (!res.ok)
      throw new Error((await res.text()) || "No se pudo eliminar la categoría");
  }

  async reactivateCategory(id: string): Promise<AdminCategory> {
    const res = await fetch(`/api/admin/catalog/categories/${id}/reactivate`, {
      method: "POST",
      credentials: "include",
      headers: { accept: "application/json" },
    });
    if (!res.ok)
      throw new Error(
        (await res.text()) || "No se pudo reactivar la categoría"
      );
    return parse<AdminCategory>(res);
  }

  // -------- Servicios
  async createService(
    categoryId: string,
    payload: { name: string; durationMinutes: number; active?: boolean }
  ): Promise<AdminService> {
    const res = await fetch(
      `/api/admin/catalog/categories/${categoryId}/services`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify(payload),
      }
    );
    if (!res.ok)
      throw new Error((await res.text()) || "No se pudo crear el servicio");
    return parse<AdminService>(res);
  }

  async updateService(
    id: string,
    patch: { name?: string; durationMinutes?: number; active?: boolean }
  ): Promise<AdminService> {
    const res = await fetch(`/api/admin/catalog/services/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok)
      throw new Error(
        (await res.text()) || "No se pudo actualizar el servicio"
      );
    return parse<AdminService>(res);
  }

  async deleteService(id: string): Promise<void> {
    const res = await fetch(`/api/admin/catalog/services/${id}`, {
      method: "DELETE",
      credentials: "include",
      headers: { accept: "application/json" },
    });
    if (!res.ok)
      throw new Error((await res.text()) || "No se pudo eliminar el servicio");
  }

  async reactivateService(id: string): Promise<AdminService> {
    const res = await fetch(`/api/admin/catalog/services/${id}/reactivate`, {
      method: "POST",
      credentials: "include",
      headers: { accept: "application/json" },
    });
    if (!res.ok)
      throw new Error(
        (await res.text()) || "No se pudo reactivar el servicio"
      );
    return parse<AdminService>(res);
  }
}
