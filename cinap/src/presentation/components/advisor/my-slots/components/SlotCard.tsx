"use client";

import type { MySlot } from "@domain/mySlots";
import { endTime, formatDateEs } from "../utils/time";

type Props = {
  slot: MySlot;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onReactivate: (id: string) => Promise<void>;
  onDisable: (id: string) => Promise<void>;        
  notify: (msg: string, tone?: "info" | "success" | "error") => void;
};

export default function SlotCard({ slot: s, onEdit, onDelete, onReactivate, onDisable, notify }: Props) {
  const badge =
    s.status === "disponible" ? "bg-emerald-50 text-emerald-700"
    : s.status === "ocupado" ? "bg-amber-50 text-amber-700"
    : "bg-rose-50 text-rose-700";

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${badge}`}>
          {s.status}
        </span>
      </div>

      <div className="space-y-3 px-5 py-4">
        <div className="text-sm font-semibold text-blue-600">{s.category}</div>
        <div className="text-lg font-semibold text-neutral-900">{s.service}</div>

        <div className="space-y-2 text-sm text-neutral-700">
          <div className="flex items-center gap-2"><span className="font-medium">Fecha:</span><span>{formatDateEs(s.date)}</span></div>
          <div className="flex items-center gap-2"><span className="font-medium">Hora:</span><span>{s.time} - {endTime(s.time, s.duration)}</span></div>
          <div className="flex items-center gap-2"><span className="font-medium">Lugar:</span><span>{s.location} - {s.room}</span></div>
          <div className="flex items-center gap-2"><span className="font-medium">Duración:</span><span>{s.duration} min</span></div>
          {s.notes && <div className="flex items-start gap-2"><span className="font-medium">Notas:</span><span>{s.notes}</span></div>}
        </div>

        {s.student && (
          <div className="mt-2 rounded-lg bg-emerald-50 p-2 text-sm text-emerald-700">
            {s.student.name} — {s.student.email}
          </div>
        )}
      </div>

      {(s.status === "disponible" || s.status === "cancelado" || s.status === "expirado") && (
        <div className="flex gap-2 border-t border-slate-100 p-4">
          {s.status === "disponible" && (
            <>
              <button
                onClick={() => onEdit(s.id)}
                className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Modificar
              </button>

              <button
                onClick={async () => {
                  try {
                    await onDisable(s.id);
                    notify("Cupo deshabilitado", "success");
                  } catch (e: any) {
                    notify(e?.message || "No se pudo deshabilitar", "error");
                  }
                }}
                className="flex-1 rounded-lg bg-gray-600 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-700"
              >
                Deshabilitar
              </button>
            </>
          )}

          {(s.status === "cancelado" || s.status === "expirado") && (
            <button
              onClick={async () => {
                try {
                  await onReactivate(s.id);
                  notify("Cupo reactivado", "success");
                } catch (e: any) {
                  notify(e?.message || "No se pudo reactivar", "error");
                }
              }}
              className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Reactivar
            </button>
          )}

          <button
            onClick={() => onDelete(s.id)}
            className="flex-1 rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700"
          >
            Eliminar
          </button>
        </div>
      )}
    </div>
  );
}
