"use client";

import DashboardHeader from "@/presentation/components/shared/DashboardHeader";
import StatusCards from "@presentation/components/dashboard/StatusCards";
import ChatWidget from "@/presentation/components/shared/widgets/ChatWidget";
import { RoleSections } from "@presentation/components/dashboard/RoleSections";
import { useDashboardData } from "@/presentation/components/dashboard/hooks/useDashboardData";

import type { Role } from "@domain/auth";
import { normalizeRole } from "@domain/auth";
import { useAuth } from "@/presentation/components/auth/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const router = useRouter();
  const { me, mounted } = useAuth();

  const isAuthed = me.authenticated === true;
  const user = isAuthed ? me.user : undefined;

  const hasValidRole = user?.role && user.role.trim() !== "";
  const normalizedRole = hasValidRole ? (normalizeRole(user.role) as Role) : null;

  const { data, loading, error } = useDashboardData(normalizedRole, user?.id);

  useEffect(() => {
    if (mounted && !isAuthed) {
      router.replace("/auth/login");
    }
  }, [mounted, isAuthed, router]);

  if (!mounted || !isAuthed) {
    return null;
  }

  const validRole = hasValidRole ? normalizedRole : null;
  const showSkeleton = loading || !validRole || !data;
  const showError = Boolean(error);

  const headers = {
    teacher: {
      title: "Panel Docente",
      subtitle: "Tus proximas asesorias y recomendaciones",
      ctaHref: "/profesor/asesorias/agendar",
      ctaLabel: "Agendar asesoria",
    },
    advisor: {
      title: "Panel Asesor",
      subtitle: "Gestiona cupos y solicitudes",
      ctaHref: "/asesor/crear-cupos",
      ctaLabel: "Abrir cupo",
    },
    admin: {
      title: "Panel Administrador",
      subtitle: "Vision general del sistema",
      ctaHref: "/admin/registrar-asesor",
      ctaLabel: "Registrar asesor",
    },
  } as const;

  const shouldRenderChat = !showSkeleton && !showError && validRole && validRole !== "admin";

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[1200px] px-6 py-8">
        {showError ? (
          <DashboardError message={error ?? "Ocurrio un error al cargar el dashboard."} />
        ) : showSkeleton ? (
          <DashboardSkeleton />
        ) : (
          <>
            <DashboardHeader
              title={headers[validRole].title}
              subtitle={headers[validRole].subtitle}
              ctaHref={headers[validRole].ctaHref}
              ctaLabel={headers[validRole].ctaLabel}
            />

            <StatusCards
              role={validRole}
              isCalendarConnected={data.isCalendarConnected}
              monthCount={data.monthCount}
              pendingCount={data.pendingCount}
              adminMetrics={data.adminMetrics}
            />

            <RoleSections role={validRole} data={data} />
          </>
        )}
      </div>

      {shouldRenderChat && <ChatWidget />}
    </main>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse" aria-hidden="true">
      <div className="h-40 rounded-2xl bg-slate-200" />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="h-40 rounded-2xl bg-slate-200" />
        <div className="h-40 rounded-2xl bg-slate-200" />
        <div className="h-40 rounded-2xl bg-slate-200" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="h-[420px] rounded-2xl bg-slate-200" />
        <div className="h-[420px] rounded-2xl bg-slate-200" />
      </div>
    </div>
  );
}

function DashboardError({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm">
      <h2 className="text-lg font-semibold text-red-800">No pudimos cargar el dashboard</h2>
      <p className="mt-2 text-sm">{message}</p>
      <p className="mt-4 text-xs text-red-600">Intenta recargar la pagina o vuelve mas tarde.</p>
    </div>
  );
}
