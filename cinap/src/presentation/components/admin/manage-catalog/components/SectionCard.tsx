import React from "react";

export default function SectionCard({
  title, subtitle, children, className,
}: {
  title: string; subtitle?: string; children: React.ReactNode; className?: string;
}) {
  return (
    <section className={`overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-blue-100 ${className ?? ""}`}>
      <div className="flex items-center justify-between border-b border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-5">
        <div>
          <h2 className="text-xl font-semibold text-blue-900">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-blue-700">{subtitle}</p>}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}
