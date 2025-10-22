import type { Appointment,  } from "@domain/appointment";
import type { Role } from "@domain/auth";

export type AdminMetrics = {
  advisorsTotal: number;
  teachersTotal: number;
  appointmentsThisMonth: number;
  pendingCount: number;
  activeCategories: number;
  activeServices: number;
};

export type DashboardData = {
  upcoming: Appointment[];
  monthCount: number;         
  pendingCount: number;       
  isCalendarConnected: boolean;
  adminMetrics?: AdminMetrics;
  upcomingTotal: number; 
};

export type DashboardInput = {
  role: Role;
  userId?: string;
};

export interface DashboardRepo {
  getDashboard(input: DashboardInput): Promise<DashboardData>;
}

