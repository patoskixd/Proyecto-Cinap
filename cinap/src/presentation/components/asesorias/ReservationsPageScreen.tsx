"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import type { Role } from "@/domain/auth";
import { normalizeRole } from "@/domain/auth";
import { useAuth } from "@/presentation/components/auth/hooks/useAuth";
import ToastProvider from "@/presentation/components/shared/Toast/ToastProvider";
import ReservationsHeader from "./ReservationsHeader";
import ReservationsView from "./ReservationsView";
import { useReservations } from "./hooks/useReservations";

const HEADER_CONFIG: Record<Role, { title: string; subtitle: string; cta?: { href: string; label: string } }> = {
  teacher: {
    title: "Mis asesorias",
    subtitle: "Gestiona tus reservas confirmadas y pendientes",
    cta: { href: "/profesor/asesorias/agendar", label: "Nueva asesoria" },
  },
  advisor: {
    title: "Asesorias programadas",
    subtitle: "Revisa y administra las sesiones con docentes",
    cta: { href: "/asesor/crear-cupos", label: "Abrir cupo" },
  },
  admin: {
    title: "Asesorias del sistema",
    subtitle: "Vision global de todas las asesorias",
  },
};

interface Props {
  allowedRoles?: Role[];
}

export default function ReservationsPageScreen({ allowedRoles }: Props) {
  const router = useRouter();
  const { me, mounted } = useAuth();

  const isAuthed = me.authenticated === true;
  const user = isAuthed ? me.user : undefined;

  useEffect(() => {
    if (mounted && !isAuthed) {
      router.replace("/auth/login");
    }
  }, [mounted, isAuthed, router]);

  if (!mounted) return null;
  if (!isAuthed || !user) return null;

  const role = normalizeRole(user.role) as Role;
  if (allowedRoles && !allowedRoles.includes(role)) {
    return (
      <div className="mx-auto max-w-[900px] px-4 py-10 text-center">
        <h2 className="text-xl font-semibold text-rose-600">No tienes permisos para ver esta seccion.</h2>
      </div>
    );
  }

  const header = HEADER_CONFIG[role];

  return (
    <ToastProvider>
      <main className="mx-auto max-w-[1200px] px-4 py-6 md:py-8">
        <ReservationsPageContent role={role} header={header} />
      </main>
    </ToastProvider>
  );
}

function ReservationsPageContent({
  role,
  header,
}: {
  role: Role;
  header: { title: string; subtitle: string; cta?: { href: string; label: string } };
}) {
  const reservations = useReservations();

  return (
    <>
      <ReservationsHeader
        title={header.title}
        subtitle={header.subtitle}
        cta={header.cta}
        tabs={{
          active: reservations.tab,
          totals: reservations.totals,
          onSelect: reservations.setTab,
        }}
      />
      <ReservationsView role={role} state={reservations} />
    </>
  );
}
