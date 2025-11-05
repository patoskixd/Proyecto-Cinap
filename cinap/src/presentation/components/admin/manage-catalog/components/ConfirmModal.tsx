// components/ConfirmModal.tsx
"use client";

import React, { useEffect } from "react";

type Props = {
  title: string;
  /** Contenido central (detalles de lo que se elimina / se va a guardar) */
  body?: React.ReactNode;
  /** Mensaje superior; si es eliminación y no lo pasas, muestra un mensaje por defecto */
  message?: string;
  cancelLabel?: string;   // default: "Volver"
  confirmLabel?: string;  // default: "Sí, eliminar" si es peligroso; "Confirmar" si no
  /** Fuerza estilo peligroso (botón rojo). Si no lo pasas, se infiere si title/confirmLabel incluyen "elimin" */
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
};

export default function ConfirmModal({
  title,
  body,
  message,
  cancelLabel,
  confirmLabel,
  danger,
  onCancel,
  onConfirm,
}: Props) {
  // Detecta automáticamente "estado peligroso" si el título o el label contienen "elimin"
  const inferredDanger = /elimin/i.test(`${title} ${confirmLabel ?? ""}`);
  const isDanger = danger ?? inferredDanger;

  const finalCancel = cancelLabel ?? "Volver";
  const finalConfirm = confirmLabel ?? (isDanger ? "Sí, eliminar" : "Confirmar");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
      aria-modal="true"
      role="dialog"
    >
      <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden transform animate-in zoom-in-95 duration-200">
        {/* Header con gradiente */}
        {isDanger ? (
          <div className="h-16 bg-gradient-to-r from-red-500 via-red-600 to-rose-600 relative">
            <div className="absolute inset-0 bg-black/10"></div>
          </div>
        ) : (
          <div className="h-16 bg-gradient-to-r from-blue-600 via-blue-700 to-yellow-500 relative">
            <div className="absolute inset-0 bg-black/10"></div>
          </div>
        )}

        {/* Contenido */}
        <div className="px-6 py-6 -mt-4 relative">
          {/* Ícono */}
          <div className="flex justify-center mb-4">
            {isDanger ? (
              <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-red-500 rounded-full shadow-xl border-4 border-white flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full shadow-xl border-4 border-white flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>

          <h3 className="text-xl font-bold text-gray-900 text-center mb-2">{title}</h3>
          
          {message && (
            <p className="text-center text-gray-600 mb-4">{message}</p>
          )}

          {body && (
            <div className={`space-y-2 rounded-xl p-4 border mb-6 text-sm ${
              isDanger 
                ? "bg-gradient-to-br from-gray-50 to-red-50/30 border-red-200/50 text-gray-900" 
                : "bg-gradient-to-br from-gray-50 to-blue-50/30 border-blue-200/50 text-gray-900"
            }`}>
              {body}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all duration-200"
            >
              {finalCancel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`flex-1 px-6 py-3 font-medium text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 ${
                isDanger
                  ? "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700"
                  : "bg-gradient-to-r from-blue-600 to-yellow-500 hover:from-blue-700 hover:to-yellow-600"
              }`}
            >
              {finalConfirm}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
