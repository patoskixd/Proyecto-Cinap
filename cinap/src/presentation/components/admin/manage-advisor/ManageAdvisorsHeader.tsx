"use client";
import React from "react";

type Props = {
  query: string;
  onQueryChange: (v: string) => void;
};

export default function ManageAdvisorsHeader({ query, onQueryChange }: Props) {
  return (
    <div className="mb-6 rounded-2xl border border-blue-200 bg-gradient-to-br from-white via-blue-50/30 to-yellow-50/20 p-6 shadow-lg backdrop-blur-sm md:mb-8 md:p-8">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-blue-900">Gestión de Asesores</h1>
        <p className="mt-1 text-blue-700">Administra y organiza tu equipo de asesores</p>
      </div>

      {/* Buscador */}
      <div className="flex justify-center">
        <div className="relative w-full max-w-2xl">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Buscar asesores por nombre o correo electrónico..."
            className="w-full rounded-2xl border-2 border-blue-200 bg-white/90 pl-12 pr-6 py-3 text-gray-900 placeholder-gray-500 outline-none transition-all duration-300 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 focus:bg-white shadow-sm"
          />
          {query && (
            <button
              onClick={() => onQueryChange("")}
              className="absolute inset-y-0 right-0 pr-4 flex items-center"
            >
              <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
