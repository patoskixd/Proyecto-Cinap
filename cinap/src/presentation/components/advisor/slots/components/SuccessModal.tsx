"use client";
import Link from "next/link";

type Props = {
  open: boolean;
  total: number;
  skipped?: number;
};

export default function SuccessModal({ open, total, skipped = 0 }: Props) {
  if (!open) return null;
  const effective = total ?? 0;
  const skippedInfo = skipped > 0 ? ` (${skipped} omitidos)` : "";
  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) window.location.reload();
      }}
    >
      <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden transform animate-in zoom-in-95 duration-200">
        {/* Header con gradiente */}
        <div className="h-16 bg-gradient-to-r from-green-500 via-emerald-600 to-blue-600 relative">
          <div className="absolute inset-0 bg-black/10"></div>
        </div>

        {/* Contenido */}
        <div className="px-6 py-6 -mt-4 relative text-center">
          {/* Ícono de éxito */}
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full shadow-xl border-4 border-white flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-2">¡Cupos creados exitosamente!</h3>
          <p className="text-gray-600 mb-6">
            Se generaron <strong className="text-green-600">{effective}</strong> cupos de asesoría{skippedInfo}.
          </p>

          <div className="flex flex-col gap-3">
            <Link
              href="/dashboard?role=advisor"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Ir al Dashboard
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all duration-200"
            >
              Abrir nuevos cupos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
