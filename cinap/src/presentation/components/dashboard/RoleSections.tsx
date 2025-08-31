// src/presentation/components/dashboard/RoleSections.tsx
import UpcomingList from "@presentation/components/dashboard/UpcomingList";
import TeacherPanel from "@/presentation/components/teacher/dashboard/TeacherPanel";
import AdminPanel from "@/presentation/components/admin/dashboard/AdminPanel";
import AdvisorPanel from "@/presentation/components/advisor/dashboard/AdvisorPanel";
import type { Role } from "@domain/auth";
import type { DashboardData } from "@app/dashboard/ports/DashboardRepo";

export function RoleSections({ role, data }: { role: Role; data: DashboardData }) {
  // misma grilla para todos: left Upcoming, right panel por rol
  return (
    <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
      {/* Columna izquierda: Próximas asesorías */}
      {data.upcoming.length > 0 ? (
        <UpcomingList items={data.upcoming} />
      ) : (
        <div className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-100">
          <div className="text-3xl">👋</div>
          <h3 className="mt-2 text-lg font-semibold">Sin próximas asesorías</h3>
          <p className="text-sm text-neutral-600">
            {role === "admin"
              ? "Aún no hay asesorías agendadas en el sistema."
              : "Agenda o confirma nuevas asesorías para verlas aquí."}
          </p>
        </div>
      )}

      {/* Columna derecha: panel por rol */}
      {role === "teacher" && <TeacherPanel items={data.drafts} />}
      {role === "advisor" && <AdvisorPanel />}
      {role === "admin" && <AdminPanel />}
    </div>
  );
}
