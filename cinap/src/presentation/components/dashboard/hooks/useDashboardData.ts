"use client";

import { useState, useEffect } from "react";
import type { Role } from "@/domain/auth";
import type { DashboardData } from "@/application/dashboard/ports/DashboardRepo";
import { GetDashboardData } from "@/application/dashboard/usecases/GetDashboardData";
import { InMemoryReservationsRepo } from "@/infrastructure/asesorias/InMemoryReservationsRepo";

const EMPTY_DATA: DashboardData = {
  isCalendarConnected: false,
  monthCount: 0,
  pendingCount: 0,
  upcoming: [],
  drafts: [],
};

export function useDashboardData(role: Role, userId?: string) {
  const [data, setData] = useState<DashboardData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        // Instanciar dependencias (esto después puede venir del DI container)
        const reservationsRepo = new InMemoryReservationsRepo();
        const getDashboardData = new GetDashboardData(reservationsRepo);
        
        const result = await getDashboardData.exec(role, userId);
        setData(result);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Error al cargar los datos del dashboard");
        setData(EMPTY_DATA);
      } finally {
        setLoading(false);
      }
    }

    if (role && userId) {
      fetchData();
    }
  }, [role, userId]);

  return { data, loading, error };
}