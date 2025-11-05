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
        {/* Header con gradiente */}
        <div className="h-16 bg-gradient-to-r from-red-500 via-red-600 to-rose-600 relative">
          <div className="absolute inset-0 bg-black/10"></div>
        </div>

        {/* Contenido */}
        <div className="px-6 py-6 -mt-4 relative">
          {/* Ícono de advertencia */}
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-red-500 rounded-full shadow-xl border-4 border-white flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>

          <h2 className="text-xl font-bold text-gray-900 text-center mb-2">Cancelar asesoría</h2>
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
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
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
