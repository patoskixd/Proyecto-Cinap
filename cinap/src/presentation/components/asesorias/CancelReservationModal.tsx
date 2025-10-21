"use client";

import type { Reservation } from "@/domain/reservation";

interface CancelReservationModalProps {
  reservation: Reservation;
  onKeep: () => void;
  onConfirmCancel: () => void | Promise<void>;
  loading: boolean;
}

export default function CancelReservationModal({
  reservation,
  onKeep,
  onConfirmCancel,
  loading,
}: CancelReservationModalProps) {
  const infoRows: Array<{ label: string; value: string | undefined }> = [
    { label: "Servicio", value: reservation.serviceTitle },
    { label: "Fecha", value: `${reservation.day} ${reservation.month}` },
    { label: "Hora", value: reservation.time },
    { label: "Duracion", value: reservation.duration },
    { label: "Asesor", value: reservation.advisor.name },
    { label: "Ubicacion", value: reservation.location },
  ];

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onKeep();
      }}
    >
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="px-6 pt-6 pb-4 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900">Cancelar asesoria</h2>
        </div>


        <div className="space-y-2 px-6 pb-6 text-sm text-neutral-700">
          <p className="mt-2 text-sm text-neutral-600">
           ¿Seguro que deseas cancelar esta asesoria? 
          </p>
          {infoRows
            .filter((row) => row.value)
            .map((row) => (
              <div key={row.label} className="flex items-start gap-2">
                <span className="min-w-[90px] font-semibold text-neutral-900">{row.label}:</span>
                <span className="text-neutral-700">{row.value}</span>
              </div>
            ))}
        </div>

        <div className="flex gap-3 border-t border-slate-200 bg-neutral-50 px-6 py-4">
          <button
            onClick={onKeep}
            disabled={loading}
            className="flex-1 rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-semibold text-neutral-700 transition-all hover:border-blue-500 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirmCancel}
            disabled={loading}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            Si, cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
