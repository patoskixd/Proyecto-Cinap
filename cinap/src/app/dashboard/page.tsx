// app/dashboard/page.tsx
"use client";

import DashboardHeader from "@/presentation/components/shared/DashboardHeader";
import StatusCards from "@presentation/components/dashboard/StatusCards";
import EmptyState from "@/presentation/components/shared/EmptyState";
import ChatWidget from "@/presentation/components/shared/widgets/ChatWidget";
import { RoleSections } from "@presentation/components/dashboard/RoleSections";

import type { Role } from "@domain/auth";
import { useAuth } from "@/presentation/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

// --- helpers ---
function normalizeRoleName(raw: string): Role {
  const r = (raw || "").toLowerCase();
  if (r.includes("admin") || r === "administrador") return "admin" as Role;
  if (r.includes("advisor") || r.includes("asesor") || r.includes("tutor")) return "advisor" as Role;
  return "teacher" as Role;
}

type DashboardData = {
  isCalendarConnected: boolean;
  monthCount: number;
  pendingCount: number;
  upcoming: any[];
  drafts: any[];
  adminMetrics?: {
    advisorsTotal: number;
    advisorsAvailable: number;
    teachersTotal: number;
    appointmentsThisMonth: number;
    approvalsPending: number;
  };
};

const EMPTY_DATA: DashboardData = {
  isCalendarConnected: false,
  monthCount: 0,
  pendingCount: 0,
  upcoming: [],
  drafts: [],
};

function buildData(role: Role, userId: string) {
  // === Mock compatibles con <UpcomingList /> ===
  // Mismo formato que usas en Advisor:
  // { id, time, dateLabel, title, student, status }
  const commonUpcoming = [
    {
      id: "adm-1",
      time: "10:30",
      dateLabel: "Hoy",
      title: "Revisión syllabus",
      student: "M. Soto",
      status: "confirmada",
    },
    {
      id: "adm-2",
      time: "16:00",
      dateLabel: "Mañana",
      title: "Diseño de rúbricas",
      student: "L. Fuentes",
      status: "confirmada",
    },
  ];

  if (role === "admin") {
    // Admin: mismo layout que advisor/teacher → izquierda UpcomingList, derecha AdminPanel
    // Aquí mockeamos “todas las asesorías agendadas” con el mismo shape
    return {
      isCalendarConnected: true,
      monthCount: 86,   // lo que ya muestras en la tarjeta
      pendingCount: 5,  // idem
      upcoming: commonUpcoming, // 👈 ahora el Admin también ve UpcomingList
      drafts: [],             // admin no usa borradores
      adminMetrics: {
        advisorsTotal: 12,
        advisorsAvailable: 9,
        teachersTotal: 120,
        appointmentsThisMonth: 86,
        approvalsPending: 5,
      },
    };
  }

  // === mocks para teacher/advisor (igual que ya tenías) ===
  const baseSeed = userId ? userId.charCodeAt(0) % 5 : 2;
  return {
    isCalendarConnected: true,
    monthCount: 4 + baseSeed,
    pendingCount: 1 + (baseSeed % 3),
    upcoming: [
      {
        id: "t-1",
        time: "10:30",
        dateLabel: "Hoy",
        title: "Revisión syllabus",
        student: "M. Soto",
        status: "confirmada",
      },
      {
        id: "t-2",
        time: "16:00",
        dateLabel: "Mañana",
        title: "Diseño de rúbricas",
        student: "L. Fuentes",
        status: "confirmada",
      },
    ],
    drafts: role === "teacher"
      ? [
          { id: "d1", icon: "📝", title: "Borrador asesoría TIC", status: "incompleto",      dateLabel: "Creado hoy" },
          { id: "d2", icon: "🧪", title: "Solicitud laboratorio", status: "falta confirmar", dateLabel: "Ayer" },
        ]
      : [],
  };
}


// --- component ---
export default function DashboardPage() {
  const router = useRouter();
  const { me, mounted } = useAuth();

  // ⚠️ Todos los hooks arriba, sin returns antes:
  const isAuthed = me.authenticated === true;
  const user = isAuthed ? me.user : undefined;
  const role = normalizeRoleName(user?.role || "");

  const data = useMemo(
    () => (isAuthed && user ? buildData(role, user.id) : EMPTY_DATA),
    [isAuthed, role, user]
  );

  useEffect(() => {
    if (mounted && !isAuthed) {
      router.replace("/auth/login");
    }
  }, [mounted, isAuthed, router]);

  // Recién aquí hacemos returns condicionales
  if (!mounted) return null;
  if (!isAuthed) return null;

  const headers = {
    teacher: { title: "Panel Docente",      subtitle: "Tus próximas asesorías y recomendaciones", ctaHref: "/asesorias/agendar", ctaLabel: "Agendar asesoría" },
    advisor: { title: "Panel Asesor",       subtitle: "Gestiona cupos y solicitudes",             ctaHref: "/asesorias/crear-cupos",     ctaLabel: "Abrir cupo" },
    admin:   { title: "Panel Administrador", subtitle: "Visión general del sistema",              ctaHref: "/admin/registrar-asesor",  ctaLabel: "Gestionar usuarios" },
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
