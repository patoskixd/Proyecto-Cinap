"use client";
import React from "react";

type Props = {
  query: string;
  onQueryChange: (v: string) => void;
};

export default function ManageAdvisorsHeader({ query, onQueryChange }: Props) {
  return (
        <header className="rounded-2xl bg-white px-6 py-6 shadow-[0_10px_30px_rgba(0,0,0,0.08)] ring-1 ring-slate-200">
        <h1 className="text-center text-3xl font-bold text-neutral-900">
            👥 Gestión de Asesores
        </h1>
        <p className="mt-1 text-center text-slate-600">
            Lista de docentes registrados
        </p>

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
      </header>
  );
}
