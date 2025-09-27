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
      <div className="space-y-3 px-1 py-2 text-sm text-neutral-800">
        <p>¿Seguro que deseas eliminar este registro?</p>

        <div className="space-y-1">
          <div>
            <span className="font-semibold">
              {kind === "campus" ? "Campus" : kind === "building" ? "Edificio" : "Sala"}:
            </span>{" "}
            {name}
          </div>
          {extra}
        </div>
      </div>

      <div className="mt-4 flex gap-2 border-t border-slate-200 pt-4">
        <button
          onClick={onCancel}
          className="flex-1 rounded-full border-2 border-slate-200 px-5 py-2 font-semibold text-neutral-700 hover:border-blue-600 hover:text-blue-600"
        >
          Volver
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 rounded-full bg-rose-600 px-5 py-2 font-semibold text-white hover:bg-rose-700"
        >
          Sí, eliminar
        </button>
      </div>
    </BaseModal>
  );
}
