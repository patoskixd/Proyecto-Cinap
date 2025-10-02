import React from "react";

export default function AdminStatusCards(props: {
  advisorsCount: number;
  teachersCount: number;
  monthCount: number;
  pendingCount: number;
  availableAdvisors: number;
}) {
  const { advisorsCount, teachersCount, monthCount, pendingCount, availableAdvisors } = props;

  const Card = ({
    title,
    value,
    iconType,
    tone = "blue",
  }: {
    title: string;
    value: string | number;
    iconType: string;
    tone?: "blue" | "emerald" | "violet" | "amber" | "rose";
  }) => {
    const getIcon = (type: string) => {
      switch (type) {
        case "advisors":
          return (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          );
        case "teachers":
          return (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          );
        case "appointments":
          return (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          );
        case "pending":
          return (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          );
        case "available":
          return (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          );
        default:
          return (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          );
      }
    };
    const tones: Record<string, string> = {
      blue: "bg-gradient-to-r from-blue-600 to-blue-700 text-white",
      emerald: "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white",
      violet: "bg-gradient-to-r from-violet-600 to-violet-700 text-white",
      amber: "bg-gradient-to-r from-amber-600 to-amber-700 text-white",
      rose: "bg-gradient-to-r from-rose-600 to-rose-700 text-white",
    };
    return (
      <div className="flex items-center gap-4 rounded-2xl border border-blue-100 bg-white p-5 ring-1 ring-blue-100 shadow-lg">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tones[tone]} shadow-sm`}>
          {getIcon(iconType)}
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-blue-700">{title}</div>
          <div className="text-2xl font-extrabold text-blue-900">{value}</div>
        </div>
      </div>
    );
  };

  return (
    <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <Card title="Asesores" value={advisorsCount} iconType="advisors" />
      <Card title="Docentes" value={teachersCount} iconType="teachers" tone="violet" />
      <Card title="Asesorías del mes" value={monthCount} iconType="appointments" tone="amber" />
      <Card title="Pendientes" value={pendingCount} iconType="pending" tone="rose" />
      <Card title="Asesores disponibles" value={availableAdvisors} iconType="available" tone="emerald" />
    </section>
  );
}
