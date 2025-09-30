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

  const defaultDangerMsg = "¿Seguro que deseas eliminar los siguientes datos?";

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
      aria-modal="true"
      role="dialog"
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white/95 backdrop-blur-xl shadow-2xl border border-white/20">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-4">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>

        <div className="space-y-3 px-5 py-4 text-sm text-gray-700">
          {isDanger ? (
            <p>{message ?? defaultDangerMsg}</p>
          ) : message ? (
            <p>{message}</p>
          ) : null}

          {body}
        </div>

        <div className="flex gap-3 px-5 py-4 bg-gray-50/80">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 font-medium text-gray-700 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200"
          >
            {finalCancel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 rounded-xl px-4 py-2.5 font-medium text-white transition-all duration-200 ${
              isDanger
                ? "bg-red-600 hover:bg-red-700 shadow-lg hover:shadow-red-200"
                : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-blue-200"
            }`}
          >
            {finalConfirm}
          </button>
        </div>
      </div>
    </div>
  );
}
