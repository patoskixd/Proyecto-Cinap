"use client";

import DashboardHeader from "@/presentation/components/shared/DashboardHeader";
import StatusCards from "@presentation/components/dashboard/StatusCards";
import EmptyState from "@/presentation/components/shared/EmptyState";
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
  const role = hasValidRole ? normalizeRole(user.role) as Role : null;

  // Usar el hook para obtener datos del dashboard
  const { data, loading, error } = useDashboardData(role, user?.id);

  useEffect(() => {
    if (mounted && !isAuthed) {
      router.replace("/auth/login");
    }
  }, [mounted, isAuthed, router]);

  if (!mounted) return null;
  if (!isAuthed) return null;
  if (!hasValidRole) return <div className="flex justify-center items-center min-h-screen">Cargando...</div>;
  if (error) return <div className="flex justify-center items-center min-h-screen text-red-600">{error}</div>;

  // En este punto, role está garantizado como válido por la validación hasValidRole
  const validRole = role as Role;

  const headers = {
    teacher: { title: "Panel Docente",      subtitle: "Tus próximas asesorías y recomendaciones", ctaHref: "/profesor/asesorias/agendar", ctaLabel: "Agendar asesoría" },
    advisor: { title: "Panel Asesor",       subtitle: "Gestiona cupos y solicitudes",             ctaHref: "/asesor/crear-cupos",     ctaLabel: "Abrir cupo" },
    admin:   { title: "Panel Administrador", subtitle: "Visión general del sistema",              ctaHref: "/admin/registrar-asesor",  ctaLabel: "Registrar asesor" },
  } as const;

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-8">
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

      {validRole !== "admin" && <ChatWidget />}


    </div>
  );
}
