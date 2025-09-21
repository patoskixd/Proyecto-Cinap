"use client";

import { prettyDateTime, timeAgo } from "../utils/date";
import type { PendingConfirmation } from "@domain/confirmations";

export default function PendingCard({ r }: { r: PendingConfirmation }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between px-5 pt-5">
        <div className="flex items-center gap-3">
          <span
            className={[
              "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
              (r as any).category === "matematicas" && "bg-rose-100 text-rose-700",
              (r as any).category === "fisica" && "bg-blue-100 text-blue-700",
              (r as any).category === "quimica" && "bg-emerald-100 text-emerald-700",
              (r as any).category === "programacion" && "bg-violet-100 text-violet-700",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {(r as any).categoryLabel ?? (r as any).categoria_nombre ?? "Categoría"}
          </span>
          <span className="text-sm text-neutral-500">{timeAgo(r.createdAtISO)}</span>
        </div>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">Pendiente</span>
      </div>

      <div className="px-5 py-4">
        <h3 className="mb-2 text-lg font-semibold text-neutral-900">{r.serviceTitle}</h3>

        <div className="grid gap-2 text-sm text-neutral-700">
          <div className="flex items-center gap-2">
            <span className="font-medium">Docente:</span>
            <span>{r.teacher}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Fecha y hora:</span>
            <span>{prettyDateTime(r.dateISO, r.time)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Ubicación:</span>
            <span>{r.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Sala:</span>
            <span>{r.room}</span>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 bg-slate-50 px-5 py-3">
        <div className="text-sm italic text-neutral-600">
          Confirmación enviada por <span className="font-medium not-italic">{r.teacherEmail}</span>
        </div>
      </div>
    </div>
  );
}
