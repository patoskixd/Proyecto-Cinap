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
      <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 overflow-hidden transform animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200 py-4 sm:py-5">
          <div className="px-6">
            <h3 className="text-lg font-bold text-blue-900 sm:text-xl text-center">{title}</h3>
          </div>
        </div>

        {/* Contenido */}
        <div className="px-6 py-6">
          {message && (
            <p className="text-center text-gray-600 mb-4">{message}</p>
          )}

          {body && (
            <div className={`space-y-2 rounded-xl p-4 border mb-6 text-sm ${
              isDanger 
                ? "bg-red-50/50 border-red-200/50 text-gray-900" 
                : "bg-blue-50/50 border-blue-200/50 text-gray-900"
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
              className={`flex-1 px-6 py-3 font-medium rounded-xl transition-all duration-200 ${
                isDanger
                  ? "bg-red-100/80 backdrop-blur-sm border border-red-200/50 text-red-700 shadow-md hover:bg-red-200/80 hover:shadow-lg"
                  : "bg-blue-100/80 backdrop-blur-sm border border-blue-200/50 text-blue-700 shadow-md hover:bg-blue-200/80 hover:shadow-lg"
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
