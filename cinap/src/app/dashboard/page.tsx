"use client";

import DashboardHeader from "@/presentation/components/shared/DashboardHeader";
import StatusCards from "@presentation/components/dashboard/StatusCards";
import EmptyState from "@/presentation/components/shared/EmptyState";
import ChatWidget from "@/presentation/components/shared/widgets/ChatWidget";
import { RoleSections } from "@presentation/components/dashboard/RoleSections";
import { useDashboardData } from "@/presentation/components/dashboard/hooks/useDashboardData";

import type { Role } from "@domain/auth";
import { useAuth } from "@/presentation/components/auth/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

function normalizeRoleName(raw: string): Role {
  const r = (raw || "").toLowerCase();
  if (r.includes("admin") || r === "administrador") return "admin" as Role;
  if (r.includes("advisor") || r.includes("asesor") || r.includes("tutor")) return "advisor" as Role;
  return "teacher" as Role;
}


export default function DashboardPage() {
  const router = useRouter();
  const { me, mounted } = useAuth();

  const isAuthed = me.authenticated === true;
  const user = isAuthed ? me.user : undefined;
  const role = normalizeRoleName(user?.role || "");

  // Usar el hook para obtener datos del dashboard
  const { data, loading, error } = useDashboardData(role, user?.id);

  useEffect(() => {
    if (mounted && !isAuthed) {
      router.replace("/auth/login");
    }
  }, [mounted, isAuthed, router]);

  if (!mounted) return null;
  if (!isAuthed) return null;
  if (loading) return <div className="flex justify-center items-center min-h-screen">Cargando...</div>;
  if (error) return <div className="flex justify-center items-center min-h-screen text-red-600">{error}</div>;

  const headers = {
    teacher: { title: "Panel Docente",      subtitle: "Tus próximas asesorías y recomendaciones", ctaHref: "/asesorias/agendar", ctaLabel: "Agendar asesoría" },
    advisor: { title: "Panel Asesor",       subtitle: "Gestiona cupos y solicitudes",             ctaHref: "/asesorias/crear-cupos",     ctaLabel: "Abrir cupo" },
    admin:   { title: "Panel Administrador", subtitle: "Visión general del sistema",              ctaHref: "/admin/registrar-asesor",  ctaLabel: "Registrar asesor" },
  } as const;

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-8">
      <DashboardHeader
        title={headers[role].title}
        subtitle={headers[role].subtitle}
        ctaHref={headers[role].ctaHref}
        ctaLabel={headers[role].ctaLabel}
      />

      <StatusCards
        role={role}
        isCalendarConnected={data.isCalendarConnected}
        monthCount={data.monthCount}
        pendingCount={data.pendingCount}
        adminMetrics={data.adminMetrics}
      />

      <RoleSections role={role} data={data} />

      {role !== "admin" && <ChatWidget />}

      {data.upcoming.length === 0 && data.drafts.length === 0 && (
        <EmptyState icon="👋" title="Sin datos por ahora" description="Vuelve más tarde o crea tu primera solicitud." />
      )}
    </div>
  );
}
