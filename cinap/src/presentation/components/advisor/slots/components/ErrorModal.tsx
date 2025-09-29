"use client";

import React from "react";

type Conflict = { cupoId?: string; inicio: string; fin: string };

type Props = {
  open: boolean;
  message?: string;
  conflicts?: Conflict[];
  onClose(): void;
};

function fmtRange(iniIso: string, finIso: string) {
  const ini = new Date(iniIso);
  const fin = new Date(finIso);
  const fecha = ini.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).replace(",", "");
  const hi = ini.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  const hf = fin.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  return `${fecha} · ${hi} – ${hf}`;
}

export default function ErrorModal({ open, message, conflicts, onClose }: Props) {
  if (!open) return null;

  const sorted = [...(conflicts ?? [])].sort(
    (a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime()
  );

  const list = sorted.map((c, i) => (
    <li key={`${c.cupoId ?? i}-${c.inicio}`} className="rounded-md bg-rose-50 px-3 py-2 text-rose-800">
      {fmtRange(c.inicio, c.fin)}
    </li>
  ));


  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-xl ring-1 ring-rose-100">
        {/* Ícono rojo */}
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100">
          <svg className="h-6 w-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <h3 className="text-lg font-bold text-neutral-900">No se pudieron crear los cupos</h3>
        <p className="mt-1 text-sm text-neutral-600">
          {message ?? "Este recurso ya tiene cupos en los horarios seleccionados."}
        </p>

        {list.length > 0 && (
          <div className="mt-4 text-left">
            <div className="mb-2 text-sm font-semibold text-neutral-800">Períodos ocupados:</div>
            <ul className="space-y-2">{list}</ul>
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-5 inline-flex items-center justify-center rounded-full bg-gradient-to-br from-rose-600 to-rose-700 px-6 py-3 font-semibold text-white shadow-sm transition"
        >
          Cerrar
        </button>

        <p className="mt-2 text-xs text-neutral-500">
          Corrige las horas o el recurso y vuelve a intentar.
        </p>
      </div>
    </div>
  );
}
