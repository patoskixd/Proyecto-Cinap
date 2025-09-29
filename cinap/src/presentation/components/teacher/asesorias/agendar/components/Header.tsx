"use client";

export default function Header() {
  return (
    <div className="mb-6 rounded-2xl border border-blue-200 bg-gradient-to-br from-white via-blue-50/30 to-yellow-50/20 p-6 shadow-lg backdrop-blur-sm md:mb-8 md:p-8">
      <div>
        <h1 className="text-3xl font-bold text-blue-900">Programar asesoría</h1>
        <p className="mt-1 text-blue-700">
          Gestión centralizada de solicitudes con trazabilidad completa.
        </p>
      </div>
    </div>
  );
}
