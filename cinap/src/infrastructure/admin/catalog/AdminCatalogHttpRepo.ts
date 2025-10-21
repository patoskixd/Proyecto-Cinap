"use client";

import type { AdminCatalogRepo } from "@/application/admin/catalog/ports/AdminCatalogRepo";
import type { AdminCategory, AdminService } from "@/domain/admin/catalog";

async function parse<T>(res: Response): Promise<T> {
  const raw = await res.text();
  let data: any = null;
  try { data = raw ? JSON.parse(raw) : null; } catch { data = raw; }

  if (!res.ok) {
    let msg: string = `HTTP ${res.status}`;
    if (data) {
      const d = (data.detail ?? data.message ?? data);
      if (typeof d === "string") {
        msg = d;
      } else if (d && typeof d === "object") {
        msg = d.message ?? JSON.stringify(d);
      }
    }
    throw new Error(msg);
  }
  return data as T;
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

    return parse<AdminCategory>(res);
  }

  async deleteCategory(id: string): Promise<void> {
    const res = await fetch(`/api/admin/catalog/categories/${id}`, {
      method: "DELETE",
      credentials: "include",
      headers: { accept: "application/json" },
    });
    return parse<void>(res);
  }

  async reactivateCategory(id: string): Promise<AdminCategory> {
    const res = await fetch(`/api/admin/catalog/categories/${id}/reactivate`, {
      method: "POST",
      credentials: "include",
      headers: { accept: "application/json" },
    });

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

    return parse<AdminService>(res);
  }

  async deleteService(id: string): Promise<void> {
    const res = await fetch(`/api/admin/catalog/services/${id}`, {
      method: "DELETE",
      credentials: "include",
      headers: { accept: "application/json" },
    });
    return parse<void>(res);
  }

  async reactivateService(id: string): Promise<AdminService> {
    const res = await fetch(`/api/admin/catalog/services/${id}/reactivate`, {
      method: "POST",
      credentials: "include",
      headers: { accept: "application/json" },
    });
    return parse<AdminService>(res);
  }
}
