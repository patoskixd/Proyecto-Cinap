//componente que muestra un estado vacío en el dashboard
// Incluye un ícono, título, descripción y un botón de acción opcional
// Se usa para indicar que no hay datos disponibles y sugerir una acción al usuario

import Link from "next/link";

export default function EmptyState({
  icon = "calendar",
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
  const getIcon = (iconType: string) => {
    switch (iconType) {
      case "calendar":
        return (
          <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case "users":
        return (
          <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  return (
    <div className="mb-8 rounded-2xl border border-blue-200 bg-gradient-to-br from-white via-blue-50/30 to-blue-50/20 p-10 text-center shadow-lg backdrop-blur-sm">
      <div className="mx-auto max-w-xl">
        <div className="mb-4 flex justify-center">{getIcon(icon)}</div>
        <h2 className="text-2xl font-semibold text-blue-900">{title}</h2>
        {description && (
          <p className="mx-auto mt-2 max-w-md text-lg text-blue-700">{description}</p>
        )}
        {actionHref && actionLabel && (
          <Link
            href={actionHref}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-blue-600 hover:bg-blue-700 px-6 py-3 text-lg font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            {actionLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
