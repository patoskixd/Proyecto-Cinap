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
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
      aria-modal="true"
      role="dialog"
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
        </div>

        <div className="space-y-3 px-5 py-4 text-sm text-neutral-800">
          {isDanger ? (
            <p>{message ?? defaultDangerMsg}</p>
          ) : message ? (
            <p>{message}</p>
          ) : null}

          {body}
        </div>

        <div className="flex gap-2 border-t border-slate-200 px-5 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-full border-2 border-slate-200 px-5 py-2 font-semibold text-neutral-700 hover:border-blue-600 hover:text-blue-600"
          >
            {finalCancel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 rounded-full px-5 py-2 font-semibold text-white ${
              isDanger
                ? "bg-rose-600 hover:bg-rose-700"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {finalConfirm}
          </button>
        </div>
      </div>
    </div>
  );
}
