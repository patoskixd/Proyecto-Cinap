"use client";

import type { MySlot } from "@/domain/advisor/mySlots";
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
    <div className="overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-br from-white via-blue-50/30 to-yellow-50/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-blue-300">
      {/* Header con gradiente institucional */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-yellow-500 px-4 py-3">
        <div className="flex items-center justify-between">
          <span className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide bg-white/90 backdrop-blur-sm shadow-sm ${badge.replace('bg-', 'text-')}`}>
            {s.status}
          </span>
        </div>
      </div>

      <div className="space-y-3 px-5 py-4 bg-white/60 backdrop-blur-sm">
        <div className="text-sm font-bold text-blue-800 bg-blue-50/50 px-2 py-1 rounded-lg inline-block">{s.category}</div>
        <div className="text-lg font-bold text-blue-900">{s.service}</div>

        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-3 p-2 rounded-lg bg-blue-50/50">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div>
              <span className="font-bold text-blue-800">Fecha:</span>
              <span className="ml-2 text-blue-700 font-medium">{formatDateEs(s.date)}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 p-2 rounded-lg bg-yellow-50/50">
            <svg className="w-5 h-5 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <span className="font-bold text-yellow-800">Hora:</span>
              <span className="ml-2 text-yellow-700 font-medium">{s.time} - {endTime(s.time, s.duration)}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 p-2 rounded-lg bg-blue-50/50">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div>
              <span className="font-bold text-blue-800">Lugar:</span>
              <span className="ml-2 text-blue-700 font-medium">{s.location} - {s.room}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 p-2 rounded-lg bg-yellow-50/50">
            <svg className="w-5 h-5 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <div>
              <span className="font-bold text-yellow-800">Duración:</span>
              <span className="ml-2 text-yellow-700 font-medium">{s.duration} min</span>
            </div>
          </div>
          {s.notes && (
            <div className="flex items-start gap-3 p-2 rounded-lg bg-blue-50/50">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div>
                <span className="font-bold text-blue-800">Notas:</span>
                <span className="ml-2 text-blue-700 font-medium">{s.notes}</span>
              </div>
            </div>
          )}
        </div>

        {s.student && (
          <div className="mt-3 rounded-lg bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 p-3 text-sm">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="font-bold text-emerald-800">{s.student.name}</span>
              <span className="text-emerald-700">— {s.student.email}</span>
            </div>
          </div>
        )}
      </div>

      {(s.status === "disponible" || s.status === "cancelado" || s.status === "expirado") && (
        <div className="border-t border-blue-200 bg-gradient-to-r from-blue-50 via-blue-50/80 to-yellow-50/80 p-4">
          <div className="flex gap-2">
            {/* Disponible */}
            {s.status === "disponible" && (
              <>
                <button
                  onClick={() => onEdit(s.id)}
                  className="flex items-center justify-center gap-2 flex-1 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2.5 text-sm font-bold text-white transition-all hover:from-blue-700 hover:to-blue-800 hover:shadow-lg shadow-blue-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Modificar
                </button>

                <button
                  onClick={async () => {
                    try {
                      await onDisable(s.id);
                      notify("Cupo Cancelado", "error");
                    } catch (e: any) {
                      notify(e?.message || "No se pudo deshabilitar", "error");
                    }
                  }}
                  className="flex items-center justify-center gap-2 flex-1 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 px-4 py-2.5 text-sm font-bold text-white transition-all hover:from-yellow-600 hover:to-yellow-700 hover:shadow-lg shadow-yellow-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Cancelar
                </button>
              </>
            )}

            {/* Cancelado  */}
            {s.status === "cancelado" &&
              (s.locked ? (
                <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-rose-100 bg-rose-50/70 px-4 py-3 text-center text-sm text-rose-700">
                  <svg className="mb-2 h-6 w-6 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="font-semibold text-rose-700">Cupo bloqueado</p>
                  <p className="mt-1 text-xs text-rose-600">
                    Este cupo corresponde a una asesoria cancelada.
                  </p>
                </div>
              ) : (
                <>
                  <button
                    onClick={async () => {
                      try {
                        await onReactivate(s.id);
                        notify("Cupo reactivado", "success");
                      } catch (e: any) {
                        notify(e?.message || "No se pudo reactivar", "error");
                      }
                    }}
                    className="flex items-center justify-center gap-2 flex-1 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-2.5 text-sm font-bold text-white transition-all hover:from-emerald-700 hover:to-emerald-800 hover:shadow-lg shadow-emerald-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Reactivar
                  </button>

                  <button
                    onClick={() => onDelete(s.id)}
                    className="flex items-center justify-center gap-2 flex-1 rounded-full border-2 border-rose-300 bg-white/90 backdrop-blur-sm px-4 py-2.5 text-sm font-bold text-rose-700 transition-all hover:bg-rose-50 hover:border-rose-400 hover:shadow-md"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Eliminar
                  </button>
                </>
              ))}

            {/* Expirado */}
            {s.status === "expirado" && (
              <button
                onClick={async () => {
                  try {
                    await onDelete(s.id);
                  } catch (e: any) {
                    notify(e?.message || "No se pudo eliminar", "error");
                  }
                }}
                className="flex items-center justify-center gap-2 flex-1 rounded-full border-2 border-rose-300 bg-white/90 backdrop-blur-sm px-4 py-2.5 text-sm font-bold text-rose-700 transition-all hover:bg-rose-50 hover:border-rose-400 hover:shadow-md"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Eliminar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
