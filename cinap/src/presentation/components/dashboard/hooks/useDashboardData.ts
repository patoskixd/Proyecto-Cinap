"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Role } from "@/domain/auth";
import type { DashboardData } from "@/application/dashboard/ports/DashboardRepo";
import { GetDashboard } from "@/application/dashboard/usecases/GetDashboard";
import { DashboardHttpRepo } from "@/infrastructure/dashboard/DashboardHttpRepo";

const EMPTY_DATA: DashboardData = {
  isCalendarConnected: false,
  monthCount: 0,
  pendingCount: 0,
  upcoming: [],
  upcomingTotal: 0,
};

export function useDashboardData(role: Role | null, userId?: string) {
  const [data, setData] = useState<DashboardData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastArgs = useRef<{ role: Role | null; userId?: string }>({ role: null });

  const fetchData = useCallback(
    async (signal?: AbortSignal) => {
      if (!role) {
        setLoading(false);
        setData(EMPTY_DATA);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const repo = new DashboardHttpRepo();
        const uc = new GetDashboard(repo);
        const result = await uc.exec({ role, userId });

        if (!signal?.aborted) setData(result);
      } catch (e) {
        if (!signal?.aborted) {
          console.error("Error fetching dashboard data:", e);
          setError("Error al cargar los datos del dashboard");
          setData(EMPTY_DATA);
        }
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [role, userId]
  );

  useEffect(() => {
    if (
      lastArgs.current.role === role &&
      lastArgs.current.userId === userId
    ) {
      return;
    }
    lastArgs.current = { role, userId };

    const ctrl = new AbortController();
    fetchData(ctrl.signal);
    return () => ctrl.abort();
  }, [fetchData, role, userId]);

  const refresh = useCallback(() => fetchData(), [fetchData]);

  return { data, loading, error, refresh };
}
