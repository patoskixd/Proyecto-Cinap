import React from "react";

type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
};

export default function SectionCard({ title, subtitle, children, className }: Props) {
  return (
    <section className={`overflow-hidden rounded-2xl bg-white shadow-[0_10px_30px_rgba(0,0,0,0.06)] ring-1 ring-slate-100 ${className ?? ""}`}>
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-neutral-600">{subtitle}</p>}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}
