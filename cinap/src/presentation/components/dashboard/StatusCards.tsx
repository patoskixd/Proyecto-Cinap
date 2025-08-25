// src/presentation/components/dashboard/StatusCards.tsx
import type { Role } from "@domain/auth";
import type { DashboardData } from "@app/dashboard/ports/DashboardRepo";

import AdminStatusCards from "@/presentation/components/admin/dashboard/AdminStatusCards";
import AdvisorStatusCards from "@/presentation/components/advisor/dashboard/AdvisorStatusCards";
import TeacherStatusCards from "@/presentation/components/teacher/dashboard/TeacherStatusCards";

type Props =
  & Pick<DashboardData, "isCalendarConnected" | "monthCount" | "pendingCount" | "adminMetrics">
  & { role: Role };

export default function StatusCards({
  role,
  isCalendarConnected,
  monthCount,
  pendingCount,
  adminMetrics,
}: Props) {
  if (role === "admin" && adminMetrics) {
    return (
      <AdminStatusCards
        advisorsCount={adminMetrics.advisorsTotal}
        availableAdvisors={adminMetrics.advisorsAvailable}
        teachersCount={adminMetrics.teachersTotal}
        monthCount={adminMetrics.appointmentsThisMonth}
        pendingCount={adminMetrics.approvalsPending}
      />
    );
  }

  if (role === "advisor") {
    return (
      <AdvisorStatusCards
        isCalendarConnected={isCalendarConnected}
        monthCount={monthCount}
        pendingCount={pendingCount}
      />
    );
  }

  // teacher 
  return (
    <TeacherStatusCards
      isCalendarConnected={isCalendarConnected}
      monthCount={monthCount}
      pendingCount={pendingCount}
    />
  );
}
