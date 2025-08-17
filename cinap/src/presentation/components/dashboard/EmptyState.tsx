//componente que muestra un estado vacío en el dashboard
// Incluye un ícono, título, descripción y un botón de acción opcional
// Se usa para indicar que no hay datos disponibles y sugerir una acción al usuario

import Link from "next/link";

export default function EmptyState({
  icon = "📅",
  title,
  description,
  actionHref,
  actionLabel,
}: {
  icon?: string;
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="mb-8 rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-100">
      <div className="mx-auto max-w-xl">
        <div className="mb-4 text-5xl opacity-80">{icon}</div>
        <h2 className="text-2xl font-semibold text-neutral-900">{title}</h2>
        {description && (
          <p className="mx-auto mt-2 max-w-md text-lg text-neutral-600">{description}</p>
        )}
        {actionHref && actionLabel && (
          <Link
            href={actionHref}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 px-6 py-3 text-lg font-semibold text-white shadow-[0_8px_25px_rgba(37,99,235,0.3)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_35px_rgba(37,99,235,0.4)]"
          >
            <span>➕</span> {actionLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
