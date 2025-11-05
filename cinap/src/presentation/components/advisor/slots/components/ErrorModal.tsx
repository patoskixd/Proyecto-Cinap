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
  const fecha = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  })
    .format(ini)
    .replace(",", "");
  const timeFmt = new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit" });
  const hi = timeFmt.format(ini);
  const hf = timeFmt.format(fin);
  return `${fecha} ${hi} - ${hf}`;
}

function fmtCompactRange(iniIso: string, finIso: string) {
  const timeFmt = new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit" });
  const hi = timeFmt.format(new Date(iniIso));
  const hf = timeFmt.format(new Date(finIso));
  return `${hi}-${hf}`;
}

export default function ErrorModal({ open, message, conflicts, onClose }: Props) {
  if (!open) return null;

  const sorted = [...(conflicts ?? [])].sort(
    (a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime()
  );

  const summary = sorted.length
    ? sorted.map((c) => fmtCompactRange(c.inicio, c.fin)).join(", ")
    : "";
  const fallbackMessage = summary
    ? `Las siguientes horas ya están ocupadas para este recurso: ${summary}.`
    : "Este recurso ya tiene cupos en los horarios seleccionados.";
  const displayMessage = (message ?? "").trim() || fallbackMessage;

  const list = sorted.map((c, i) => (
    <li key={`${c.cupoId ?? i}-${c.inicio}`} className="rounded-md bg-rose-50 px-3 py-2 text-rose-800">
      {fmtRange(c.inicio, c.fin)}
    </li>
  ));


  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden transform animate-in zoom-in-95 duration-200">
        {/* Header con gradiente */}
        <div className="h-16 bg-gradient-to-r from-red-500 via-rose-600 to-red-700 relative">
          <div className="absolute inset-0 bg-black/10"></div>
        </div>

        {/* Contenido */}
        <div className="px-6 py-6 -mt-4 relative text-center">
          {/* Ícono de error */}
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-rose-500 rounded-full shadow-xl border-4 border-white flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-2">No se pudieron crear los cupos</h3>
          <p className="text-gray-600 mb-4">{displayMessage}</p>

          {list.length > 0 && (
            <div className="text-left bg-gradient-to-br from-red-50 to-rose-50/50 rounded-xl p-4 border border-red-200/50">
              <div className="mb-3 text-sm font-semibold text-gray-700 flex items-center gap-2">
                <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                Periodos ocupados:
              </div>
              <ul className="max-h-60 space-y-2 overflow-y-auto pr-1">{list}</ul>
            </div>
          )}

          <button
            onClick={onClose}
            className="mt-6 w-full px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Cerrar
          </button>

          <p className="mt-3 text-xs text-gray-500">
            Corrige las horas o el recurso y vuelve a intentar.
          </p>
        </div>
      </div>
    </div>
  );
}
