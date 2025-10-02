"use client";

import React from "react";
import BaseModal from "./BaseModal";

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
    <BaseModal title={title} onClose={onCancel} maxW="max-w-xl">
      <div className="space-y-4 py-2 text-sm text-gray-700">
        <p className="text-base">¿Seguro que deseas eliminar este registro?</p>

        <div className="rounded-lg bg-gray-50 p-4 space-y-2">
          <div>
            <span className="font-semibold text-gray-900">
              {kind === "campus" ? "Campus" : kind === "building" ? "Edificio" : "Sala"}:
            </span>{" "}
            <span className="text-gray-700">{name}</span>
          </div>
          {extra}
        </div>
      </div>

      <div className="mt-6 flex gap-3 pt-4">
        <button
          onClick={onCancel}
          className="flex-1 rounded-xl border border-gray-300 px-6 py-3 font-medium text-gray-700 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200"
        >
          Volver
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 rounded-xl bg-red-600 px-6 py-3 font-medium text-white hover:bg-red-700 shadow-lg hover:shadow-red-200 transition-all duration-200"
        >
          Sí, eliminar
        </button>
      </div>
    </BaseModal>
  );
}
