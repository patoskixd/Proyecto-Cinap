"use client";

import Link from "next/link";

export function SuccessModal({ open }: { open: boolean }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl ring-1 ring-blue-200">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-blue-200 border-2 border-blue-300">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-blue-900">¡Asesoría confirmada!</h3>
        <p className="mt-1 text-sm text-blue-700">
          Tu asesoría ha sido programada. Pronto recibirás un correo de confirmación.
        </p>
        <Link
          href="/dashboard"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 px-6 py-3 font-semibold text-white shadow-md transition hover:from-blue-700 hover:to-blue-800"
        >
          Ir al Dashboard
        </Link>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 block w-full text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          Agendar otra asesoría
        </button>
      </div>
    </div>
  );
}
