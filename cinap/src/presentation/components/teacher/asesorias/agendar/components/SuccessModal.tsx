"use client";

import Link from "next/link";

export function SuccessModal({ open }: { open: boolean }) {
  if (!open) return null;
  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) window.location.reload();
      }}
    >
      <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden transform animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="border-b border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4">
          <h3 className="text-xl font-bold text-blue-900">¡Asesoría confirmada!</h3>
        </div>

        {/* Contenido */}
        <div className="px-6 py-6 text-center">
          <p className="text-gray-600 mb-6">
            Tu asesoría ha sido programada. Pronto recibirás un correo de confirmación.
          </p>

          <div className="flex flex-col gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-100/80 backdrop-blur-sm border border-blue-200/50 text-blue-700 font-semibold rounded-xl shadow-md hover:bg-blue-200/80 hover:shadow-lg transition-all duration-200"
            >
              Ir al Dashboard
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all duration-200"
            >
              Agendar otra asesoría
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
