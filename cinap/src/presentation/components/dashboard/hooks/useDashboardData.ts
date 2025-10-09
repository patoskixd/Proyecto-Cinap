"use client";

import { useState, useEffect } from "react";
import type { Role } from "@/domain/auth";
import type { DashboardData } from "@/application/dashboard/ports/DashboardRepo";
import { GetDashboard } from "@/application/dashboard/usecases/GetDashboard";
import { DashboardHttpRepo } from "@/infrastructure/dashboard/DashboardHttpRepo";

const EMPTY_DATA: DashboardData = {
  isCalendarConnected: false,
  monthCount: 0,
  pendingCount: 0,
  upcoming: [],
  drafts: [],
};

export function useDashboardData(role: Role | null, userId?: string) {
  const [data, setData] = useState<DashboardData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!role) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        // Instanciar dependencias - usar DashboardHttpRepo que conecta con el backend real
        const dashboardRepo = new DashboardHttpRepo();
        const getDashboard = new GetDashboard(dashboardRepo);
        
        const result = await getDashboard.exec({ role, userId });
        setData(result);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Error al cargar los datos del dashboard");
        setData(EMPTY_DATA);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [role, userId]);

  return { data, loading, error };
}