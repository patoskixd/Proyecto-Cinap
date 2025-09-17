"use client";

import Link from "next/link";

export function SuccessModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
        <div className="mb-2 text-5xl">✅</div>
        <h3 className="text-lg font-bold text-neutral-900">¡Asesoría confirmada!</h3>
        <p className="mt-1 text-sm text-neutral-600">
          Tu asesoría ha sido programada. Pronto recibirás un correo de confirmación.
        </p>
        <Link
          href="/dashboard"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 px-6 py-3 font-semibold text-white shadow-sm transition"
        >
          Ir al Dashboard
        </Link>
        <button
          onClick={onClose}
          className="mt-2 block w-full text-sm font-semibold text-neutral-500 hover:text-neutral-700"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
