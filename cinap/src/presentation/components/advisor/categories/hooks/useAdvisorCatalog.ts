"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdvisorCatalog } from "@/domain/advisor/catalog";
import { GetAdvisorCatalog } from "@/application/advisor/catalog/usecases/GetAdvisorCatalog";
import { AdvisorCatalogHttpRepo } from "@/infrastructure/advisor/catalog/AdvisorCatalogHttpRepo";


const repo = new AdvisorCatalogHttpRepo();
const ucGet = new GetAdvisorCatalog(repo);


export type UISvc = { id: string; name: string; description?: string; duration?: number; selected?: boolean };
export type UICat = { id: string; name: string; description?: string; icon?: string };
export type UIAdvisorCategory = { category: UICat; services: UISvc[]; status: "active" | "available" };
export type UIAdvisorCatalog = {
  active: UIAdvisorCategory[];
  available: UIAdvisorCategory[];
  stats: { activeCategories: number; activeServices: number };
};

function toUI(catalog: AdvisorCatalog): UIAdvisorCatalog {
  const toMinutes = (d: unknown): number | undefined => {
    if (typeof d === "number") return d;
    if (typeof d === "string") {
      const n = parseInt(d, 10);
      return Number.isNaN(n) ? undefined : n;
    }
    return undefined;
  };

  const mapCat = (arr: any[]) =>
    arr.map(({ category, services, status }) => ({
      category,
      status,
      services: (services as any[]).map((s) => ({
        ...s,
        duration: toMinutes(s.duration),
      })),
    }));

  return {
    active: mapCat(catalog.active),
    available: mapCat(catalog.available),
    stats: catalog.stats,
  };
}

export function useAdvisorCatalog() {
  const [data, setData] = useState<UIAdvisorCatalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const out = await ucGet.exec();
      setData(toUI(out));
    } catch (e: any) {
      setError(e?.message || "No se pudo cargar el catálogo");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}
