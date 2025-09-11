"use client";
import type { AdvisorCatalogQueryRepo } from "@application/advisor-catalog/ports/AdvisorCatalogRepo";
import type { AdvisorCatalog } from "@domain/advisorCatalog";

async function parse<T>(res: Response): Promise<T> {
  const txt = await res.text();
  try { return JSON.parse(txt) as T; } catch { throw new Error(txt || `HTTP ${res.status}`); }
}

export class AdvisorCatalogHttpRepo implements AdvisorCatalogQueryRepo {
  async list(): Promise<AdvisorCatalog> {
    const res = await fetch("/api/advisor-catalog", {
      credentials: "include",
      cache: "no-store",
      headers: { accept: "application/json" },
    });
    if (!res.ok) throw new Error(await res.text());
    return parse<AdvisorCatalog>(res);
  }
}
