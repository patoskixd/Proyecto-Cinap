"use client";

import type { PendingConfirmation } from "@domain/confirmations";
import PendingCard from "./PendingCard";

export default function PendingList({ items }: { items: PendingConfirmation[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <div className="mb-2 text-4xl text-neutral-400">📭</div>
        <h3 className="mb-1 text-lg font-semibold text-neutral-900">No hay solicitudes pendientes</h3>
        <p className="mx-auto mb-3 max-w-md text-neutral-600">
          Todas las solicitudes han sido confirmadas o no hay nuevas solicitudes en este momento.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {items.map((r) => (
        <PendingCard key={r.id} r={r} />
      ))}
    </div>
  );
}
