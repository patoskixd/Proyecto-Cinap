
import StatusCards from "@/presentation/components/dashboard/StatusCards";
import UpcomingList from "@/presentation/components/dashboard/UpcomingList";
import DraftsList from "@/presentation/components/dashboard/DraftsList";
import QuickActions from "@/presentation/components/dashboard/QuickActions";
import { getDashboardData } from "@/application/dashboard/getDashboardData";
import EmptyState from "@/presentation/components/dashboard/EmptyState";
import DashboardHeader from "@/presentation/components/dashboard/DashboardHeader";

import ChatWidget from "@/presentation/components/chat/ChatWidget";

// Página principal del dashboard de asesorías  

export default async function DashboardPage() {
  const { upcoming, drafts, monthCount, pendingCount, isCalendarConnected } =
    await getDashboardData();

  const showEmpty = upcoming.length === 0 && drafts.length === 0;

  return (
    <main className="bg-slate-50">
      <div className="mx-auto max-w-[1200px] px-4 py-6 md:py-8">
        <DashboardHeader
          title="Dashboard"
          subtitle="Gestiona tus asesorías de manera inteligente"
          ctaHref="/asesorias/agendar"
          ctaLabel="Nueva Asesoría"
          ctaIcon="➕"
        />

        <StatusCards
          isCalendarConnected={isCalendarConnected}
          monthCount={monthCount}
          pendingCount={pendingCount}
        />

        {showEmpty ? (
          <EmptyState
            title="¡Comienza a programar tus asesorías!"
            description="Utiliza nuestra IA para programar, modificar y gestionar tus asesorías de manera inteligente."
            actionHref="/asesoria/agendar"
            actionLabel="Nueva Asesoría"
          />
        ) : (
          <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
            <UpcomingList items={upcoming} />
            <DraftsList items={drafts} />
          </div>
        )}
        <ChatWidget />

        <QuickActions />
      </div>
    </main>
  );
}
