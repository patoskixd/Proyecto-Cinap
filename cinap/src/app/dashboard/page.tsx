// src/app/dashboard/page.tsx
import DashboardHeader from "@/presentation/components/shared/DashboardHeader";
import StatusCards from "@presentation/components/dashboard/StatusCards";
import EmptyState from "@/presentation/components/shared/EmptyState";
import ChatWidget from "@/presentation/components/shared/widgets/ChatWidget";
import { RoleSections } from "@presentation/components/dashboard/RoleSections";

import { normalizeRole, type Role } from "@domain/auth";
import { GetDashboard } from "@application/dashboard/usecases/GetDashboard";
import { InMemoryDashboardRepo } from "@infrastructure/dashboard/InMemoryDashboardRepo";

type Search = Promise<{ role?: string }>;

export default async function DashboardPage({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const role: Role = normalizeRole(params?.role);

  // Simulación de sesión por rol (mientras no haya auth real)
  const userId =
    role === "teacher" ? "t-10" :
    role === "advisor" ? "adv-1" :
    undefined;

  const usecase = new GetDashboard(new InMemoryDashboardRepo());
  const data = await usecase.exec({ role, userId });

  const showEmpty = data.upcoming.length === 0 && data.drafts.length === 0;

  // CTA por rol
  const cta =
    role === "teacher"
      ? { href: "/asesorias/agendar", label: "Nueva Asesoría", icon: "➕" }
      : role === "advisor"
      ? { href: "/asesorias/crear-cupos", label: "Abrir cupos", icon: "➕" }
      : { href: "/admin/registrar-asesor", label: "Crear asesor", icon: "👤" };

  return (
    <main className="bg-slate-50">
      <div className="mx-auto max-w-[1200px] px-4 py-6 md:py-8">
        <DashboardHeader
          title="Dashboard"
          subtitle={
            role === "teacher"
              ? "Gestiona tus asesorías como docente"
              : role === "advisor"
              ? "Tu agenda y pendientes como asesor"
              : "Panel global de administración"
          }
          ctaHref={cta.href}
          ctaLabel={cta.label}
          ctaIcon={cta.icon}
        />

        <StatusCards
          role={role}
          isCalendarConnected={data.isCalendarConnected}
          monthCount={data.monthCount}
          pendingCount={data.pendingCount}
          adminMetrics={data.adminMetrics}
        />

        {showEmpty ? (
          <EmptyState
            title={
              role === "teacher"
                ? "¡Comienza a programar tus asesorías!"
                : role === "advisor"
                ? "No tienes atenciones asignadas por ahora."
                : "No hay elementos para mostrar"
            }
            description={
              role === "teacher"
                ? "Utiliza nuestra IA para programar, modificar y gestionar tus asesorías."
                : role === "advisor"
                ? "Revisa tus asignaciones y confirma pendientes."
                : "Configura categorías, servicios o revisa reportes."
            }
            actionHref={cta.href}
            actionLabel={cta.label}
          />
        ) : (
          <RoleSections role={role} data={data} />
        )}

      <ChatWidget />
      </div>
    </main>
  );
}
