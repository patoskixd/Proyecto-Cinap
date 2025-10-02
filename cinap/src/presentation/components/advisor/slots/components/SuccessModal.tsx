"use client";
import Link from "next/link";

type Props = {
  open: boolean;
  total: number;
  onClose(): void;
};

export default function SuccessModal({ open, total, onClose }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl ring-1 ring-blue-100">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-700">
          <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-neutral-900">¡Cupos creados exitosamente!</h3>
        <p className="mt-1 text-sm text-neutral-600">
          Se generaron <strong>{total}</strong> cupos de asesoría.
        </p>
        <Link
          href="/dashboard?role=advisor"
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
