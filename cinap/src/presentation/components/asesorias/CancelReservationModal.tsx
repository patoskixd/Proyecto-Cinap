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
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onKeep();
      }}
    >
      <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden transform animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="border-b border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4">
          <h2 className="text-xl font-bold text-blue-900">Cancelar asesoría</h2>
        </div>

        {/* Contenido */}
        <div className="px-6 py-6">
          <p className="text-center text-gray-600 mb-4">¿Seguro que deseas cancelar esta asesoría?</p>

          <div className="space-y-3 bg-gradient-to-br from-gray-50 to-red-50/30 rounded-xl p-4 border border-red-200/50">
            {infoRows
              .filter((row) => row.value)
              .map((row) => (
                <div key={row.label} className="flex items-start gap-2">
                  <span className="min-w-[90px] font-semibold text-gray-700">{row.label}:</span>
                  <span className="text-gray-900">{row.value}</span>
                </div>
              ))}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onKeep}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Volver
            </button>
            <button
              onClick={onConfirmCancel}
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-red-100/80 backdrop-blur-sm border border-red-200/50 text-red-700 font-semibold rounded-xl shadow-md hover:bg-red-200/80 hover:shadow-lg transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-700 border-t-transparent" />
              ) : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              Sí, cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
