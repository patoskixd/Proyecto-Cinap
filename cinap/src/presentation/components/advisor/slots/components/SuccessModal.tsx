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
        <div className="border-b border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 py-4 sm:py-5">
          <h3 className="text-center text-lg font-semibold text-blue-900 sm:text-xl">Cupos creados</h3>
        </div>

        {/* Contenido */}
        <div className="px-6 py-6 relative text-center">
          <p className="text-gray-600 mb-6">
            Se generaron <strong className="text-blue-600">{effective}</strong> cupos de asesoría{skippedInfo}.
          </p>

          <div className="flex flex-col gap-3">
            <Link
              href="/dashboard?role=advisor"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-100/80 backdrop-blur-sm border border-blue-200/50 px-6 py-3 font-semibold text-blue-700 shadow-md transition-all duration-200 hover:bg-blue-200/80 hover:shadow-lg hover:-translate-y-0.5"
            >
              Ir al Dashboard
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="rounded-full bg-gray-100 px-6 py-3 font-semibold text-gray-700 transition-all duration-200 hover:bg-gray-200"
            >
              Abrir nuevos cupos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
