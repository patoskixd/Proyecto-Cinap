import UpcomingAppointments from "@/presentation/components/dashboard/UpcomingAppointments";
import TeacherPanel from "@/presentation/components/teacher/dashboard/TeacherPanel";
import AdminPanel from "@/presentation/components/admin/dashboard/AdminPanel";
import AdvisorPanel from "@/presentation/components/advisor/dashboard/AdvisorPanel";
import type { Role } from "@domain/auth";
import type { DashboardData } from "@application/dashboard/ports/DashboardRepo";

export function RoleSections({ role, data }: { role: Role; data: DashboardData }) {

  return (
    <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr] items-start">
      {/* Columna izquierda: Próximas asesorías */}
      <UpcomingAppointments appointments={data.upcoming} role={role} total={data.upcomingTotal} />


      {/* Columna derecha: panel por rol */}
      {role === "teacher" && <TeacherPanel  />}
      {role === "advisor" && <AdvisorPanel />}
      {role === "admin" && <AdminPanel />}
    </div>
  );
}
