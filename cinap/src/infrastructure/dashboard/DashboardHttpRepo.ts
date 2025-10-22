"use client";
import type { DashboardRepo, DashboardData, DashboardInput } from "@/application/dashboard/ports/DashboardRepo";

async function parse<T>(res: Response): Promise<T> {
  const txt = await res.text();
  try { return JSON.parse(txt) as T; } catch { throw new Error(txt || `HTTP ${res.status}`); }
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
    return parse<DashboardData>(res);
  }
}
