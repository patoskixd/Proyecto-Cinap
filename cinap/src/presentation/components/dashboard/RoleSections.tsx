import UpcomingList from "@presentation/components/dashboard/UpcomingList";
import DraftsList from "@/presentation/components/teacher/dashboard/TeacherPanel";
import AdminPanel from "@/presentation/components/admin/dashboard/AdminPanel";
import AdvisorPanel from "@/presentation/components/advisor/dashboard/AdvisorPanel";
import type { Role } from "@domain/auth";
import type { DashboardData } from "@app/dashboard/ports/DashboardRepo";

export function RoleSections({ role, data }: { role: Role; data: DashboardData }) {
  if (data.upcoming.length === 0 && data.drafts.length === 0) return null;

  return (
    <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
      {/* Izquierda: próximas asesorías para contexto global */}
      <UpcomingList items={data.upcoming} />

      {role === "teacher" && <DraftsList items={data.drafts} />}

      {role === "advisor" && 
        <AdvisorPanel/>
      }

      {role === "admin" && <AdminPanel />}
    </div>
  );
}
