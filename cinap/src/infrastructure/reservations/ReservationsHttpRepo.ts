"use client";

import type {
  ReservationsRepo,
  ReservationListParams,
  ReservationListResult,
} from "@/application/teacher/asesorias/ports/ReservationsRepo";

async function parse<T>(res: Response): Promise<T> {
  const txt = await res.text();
  try {
    return JSON.parse(txt) as T;
  } catch {
    throw new Error(txt || `HTTP ${res.status}`);
  }
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
    return parse<ReservationListResult>(res);
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
