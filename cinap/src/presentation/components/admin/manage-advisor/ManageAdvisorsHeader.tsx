"use client";
import React from "react";

type Props = {
  query: string;
  onQueryChange: (v: string) => void;
};

export default function ManageAdvisorsHeader({ query, onQueryChange }: Props) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.06)] ring-1 ring-slate-100">
      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white">👥</div>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Gestión de Asesores</h1>
          <p className="text-sm text-neutral-600">Lista de asesores registrados</p>
        </div>
      </div>

      {/* buscador centrado */}
      <div className="mx-auto max-w-xl">
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">🔍</span>
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Buscar por nombre o correo…"
            className="w-full rounded-full border-2 border-slate-200 bg-white px-10 py-3 text-black outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>
    </section>
  );
}
