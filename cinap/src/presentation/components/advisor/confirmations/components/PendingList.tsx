"use client";

import type { PendingConfirmation } from "@/domain/advisor/confirmations";
import PendingCard from "./PendingCard";

export default function PendingList({ items }: { items: PendingConfirmation[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-white via-blue-50/30 to-yellow-50/20 p-10 text-center shadow-lg">
        <div className="mb-4 flex justify-center">
          <svg className="w-16 h-16 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="mb-2 text-lg font-semibold text-blue-900">No hay solicitudes pendientes</h3>
        <p className="mx-auto max-w-md text-blue-700">
          Todas las solicitudes han sido confirmadas o no hay nuevas solicitudes en este momento.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {items.map((r) => (
        <PendingCard key={r.id} r={r} />
      ))}
    </div>
  );
}
