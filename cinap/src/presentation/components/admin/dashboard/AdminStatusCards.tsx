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
    icon,
    tone = "blue",
  }: {
    title: string;
    value: string | number;
    icon: string;
    tone?: "blue" | "emerald" | "violet" | "amber" | "rose";
  }) => {
    const tones: Record<string, string> = {
      blue: "bg-blue-50 text-blue-600",
      emerald: "bg-emerald-50 text-emerald-600",
      violet: "bg-violet-50 text-violet-600",
      amber: "bg-amber-50 text-amber-600",
      rose: "bg-rose-50 text-rose-600",
    };
    return (
      <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 ring-1 ring-slate-100">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tones[tone]}`}>
          <span className="text-xl">{icon}</span>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{title}</div>
          <div className="text-2xl font-extrabold text-neutral-900">{value}</div>
        </div>
      </div>
    );
  };

  return (
    <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <Card title="Asesores" value={advisorsCount} icon="👩‍🏫" />
      <Card title="Docentes" value={teachersCount} icon="🎓" tone="violet" />
      <Card title="Asesorías del mes" value={monthCount} icon="📅" tone="amber" />
      <Card title="Pendientes" value={pendingCount} icon="⏳" tone="rose" />
      <Card title="Asesores disponibles" value={availableAdvisors} icon="✅" tone="emerald" />
    </section>
  );
}
