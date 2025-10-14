import type { Appointment, Draft } from "@domain/appointment";
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
  drafts: Draft[];
  monthCount: number;         
  pendingCount: number;       
  isCalendarConnected: boolean;
  adminMetrics?: AdminMetrics;
};

export type DashboardInput = {
  role: Role;
  userId?: string;
};

export interface DashboardRepo {
  getDashboard(input: DashboardInput): Promise<DashboardData>;
}
