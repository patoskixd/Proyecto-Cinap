"use client";

import type { CalendarConflict } from "@/domain/teacher/scheduling";

type Props = {
  open: boolean;
  conflicts: CalendarConflict[];
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
};

export function ConflictWarningModal({ open, conflicts, onCancel, onConfirm, loading }: Props) {
  if (!open) return null;

  const formatDateTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString("es-CL", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl md:p-8">
        {/* Header */}
        <div className="mb-6 flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-yellow-100">
            <svg
              className="h-6 w-6 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-yellow-900">
              Conflicto de calendario detectado
            </h2>
            <p className="mt-1 text-sm text-yellow-700">
              Ya tienes {conflicts.length === 1 ? "un evento" : `${conflicts.length} eventos`} en
              tu calendario que se {conflicts.length === 1 ? "solapa" : "solapan"} con esta
              asesoría.
            </p>
          </div>
        </div>

        {/* Lista de conflictos */}
        <div className="mb-6 max-h-64 space-y-3 overflow-y-auto rounded-xl border-2 border-yellow-200 bg-yellow-50/50 p-4">
          {conflicts.map((conflict, idx) => (
            <div
              key={conflict.id || idx}
              className="rounded-lg border border-yellow-200 bg-white p-3 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-900">{conflict.title}</h3>
                  <div className="mt-1 flex flex-col gap-1 text-xs text-yellow-700 sm:flex-row sm:gap-3">
                    <span className="flex items-center gap-1">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Inicio: {formatDateTime(conflict.start)}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Fin: {formatDateTime(conflict.end)}
                    </span>
                  </div>
                </div>
                {conflict.html_link && (
                  <a
                    href={conflict.html_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 rounded-md border border-yellow-300 bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700 transition hover:bg-yellow-200"
                  >
                    Ver en Calendar
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Mensaje de advertencia */}
        <div className="mb-6 rounded-lg border-l-4 border-yellow-500 bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">
            <strong>⚠️ Advertencia:</strong> Si continúas con la reserva, tendrás dos eventos al
            mismo tiempo en tu calendario. Asegúrate de que esto es lo que deseas.
          </p>
        </div>

        {/* Botones */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl border-2 border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition hover:border-gray-400 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancelar y revisar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl border-2 border-yellow-600 bg-yellow-600 px-6 py-3 font-semibold text-white transition hover:bg-yellow-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Confirmando...
              </>
            ) : (
              "Continuar de todas formas"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
