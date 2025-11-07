"use client";

import React from "react";

type DeleteKind = "campus" | "building" | "room";

export default function ConfirmModal({
  kind,
  name,
  extra,
  onCancel,
  onConfirm,
}: {
  kind: DeleteKind;
  name: string;
  /** Info adicional (dirección, n° sala, etc) */
  extra?: React.ReactNode;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
}) {
  const title =
    kind === "campus" ? "Eliminar campus" : kind === "building" ? "Eliminar edificio" : "Eliminar sala";

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
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
          <p className="text-center text-gray-600 mb-4">¿Seguro que deseas eliminar este registro?</p>

          <div className="space-y-2 bg-red-50/50 border border-red-200/50 rounded-xl p-4 mb-6">
            <div>
              <span className="font-semibold text-gray-900">
                {kind === "campus" ? "Campus" : kind === "building" ? "Edificio" : "Sala"}:
              </span>{" "}
              <span className="text-gray-700">{name}</span>
            </div>
            {extra}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all duration-200"
            >
              Volver
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-6 py-3 bg-red-100/80 backdrop-blur-sm border border-red-200/50 text-red-700 font-medium rounded-xl shadow-md hover:bg-red-200/80 hover:shadow-lg transition-all duration-200"
            >
              Sí, eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
