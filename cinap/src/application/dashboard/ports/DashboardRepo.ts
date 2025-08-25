import type { Appointment, Draft } from "@domain/appointment";
import type { Role } from "@domain/auth";

export type AdminMetrics = {
  advisorsTotal: number;
  advisorsAvailable: number;
  teachersTotal: number;
  appointmentsThisMonth: number;
  approvalsPending: number;
};

export type DashboardData = {
  upcoming: Appointment[];
  drafts: Draft[];
  monthCount: number;          // usadas por teacher/advisor
  pendingCount: number;        // usadas por teacher/advisor
  isCalendarConnected: boolean;
  adminMetrics?: AdminMetrics; // solo para admin
};

export type DashboardInput = {
  role: Role;
  userId?: string;
};

export interface DashboardRepo {
  getDashboard(input: DashboardInput): Promise<DashboardData>;
}
