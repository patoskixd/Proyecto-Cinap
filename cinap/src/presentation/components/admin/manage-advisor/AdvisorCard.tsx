"use client";
import React from "react";
import type { Advisor } from "@/domain/admin/advisors";

function initials(name: string | undefined | null) {
  if (!name || typeof name !== 'string') return "A";
  
  const i = name
    .trim()
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
  return i || "A";
}

type Props = {
  advisor: Advisor;
  categoriesById: Map<string, { id: string; name: string; icon?: string }>;
  servicesByCat: Map<string, { id: string; name: string }[]>;
  onEdit: (a: Advisor) => void;
  onDelete?: (a: Advisor) => void;
};

export default function AdvisorCard({ advisor, categoriesById, servicesByCat, onEdit, onDelete }: Props) {
  const basic = advisor.basic ?? { name: "", email: "" };
  const categories = Array.isArray(advisor.categories) ? advisor.categories : [];
  const services = Array.isArray(advisor.services) ? advisor.services : [];

  const totalServices = services.length;
  const visibleServices = services.slice(0, 3);
  const remainingServices = Math.max(0, totalServices - 3);
  const cardAppearance = advisor.active
    ? "border-blue-200/40 bg-gradient-to-br from-white via-blue-50/30 to-yellow-50/20 shadow-lg backdrop-blur-sm hover:border-blue-300/60"
    : "border-slate-200/60 bg-white shadow-md hover:border-slate-300/60";

  return (
    <div
      className={`group relative overflow-hidden rounded-3xl border transition-all duration-500 hover:-translate-y-2 hover:scale-105 hover:shadow-2xl ${cardAppearance} ${
        advisor.active ? "" : "opacity-80"
      }`}
    >
      {/* Decorative elements */}
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br from-yellow-400/20 to-blue-400/20 blur-xl transition-all duration-500 group-hover:scale-150 group-hover:bg-gradient-to-br group-hover:from-yellow-500/30 group-hover:to-blue-500/30" />
      
      {/* Status indicators */}
      <div className="absolute right-4 top-4 flex gap-2">
        {!advisor.active && (
          <div className="rounded-full bg-red-600/10 px-2 py-0.5 text-xs font-bold text-red-800">Inactivo</div>
        )}
        <div className="rounded-full bg-blue-600/10 px-2 py-0.5 text-xs font-bold text-blue-800">{advisor.categories.length}</div>
      </div>

      {/* Main content */}
      <div className="relative p-6">
        {/* Avatar and basic info */}
        <div className="mb-5 flex items-start gap-4">
          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-600 text-xl font-bold text-white shadow-xl transition-all duration-300 group-hover:scale-110">
              {initials(basic?.name)}
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-blue-900 transition-colors group-hover:text-blue-700">{basic?.name || "Sin nombre"}</h3>
            <p className="mt-1 text-sm text-blue-700/80 font-medium truncate">{basic?.email || "Sin email"}</p>
            
            {/* Role badge */}
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-yellow-100 to-blue-100 px-3 py-1 text-xs font-semibold text-blue-800 border border-yellow-200/50">
              Asesor
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="mb-4 space-y-2">
          <h4 className="text-xs font-semibold text-blue-800 uppercase tracking-wider">Especialidades</h4>
          <div className="flex flex-wrap gap-2">
            {categories.slice(0, 3).map((cid, index) => {
              const c = categoriesById.get(String(cid));
              const safeKey = `category_${String(cid || '')}_${index}`;
              return (
                <span
                  key={safeKey}
                  className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-100 to-blue-200 px-3 py-1 text-xs font-semibold text-blue-800 border border-blue-300/50 transition-all duration-200 hover:scale-105"
                  title={c?.name}
                >
                  {c?.name ?? String(cid)}
                </span>
              );
            })}
            {categories.length > 3 && (
              <span className="inline-flex items-center rounded-full bg-gradient-to-r from-gray-100 to-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 border border-gray-300/50">
                +{categories.length - 3} más
              </span>
            )}
          </div>
        </div>

        {/* Services preview */}
        {totalServices > 0 && (
          <div className="mb-5 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-yellow-800 uppercase tracking-wider">Servicios</h4>
              <span className="rounded-full bg-yellow-200 px-2 py-0.5 text-xs font-bold text-yellow-800">{totalServices}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {visibleServices.map((s, index) => {
                const sName = s.name || servicesByCat.get(s.categoryId)?.find((x) => x.id === s.id)?.name || s.id;
                const safeKey = `${String(s.categoryId || '')}_${String(s.id || '')}_${index}`;
                return (
                  <span key={safeKey} className="rounded-lg bg-gradient-to-r from-yellow-50 to-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800 border border-yellow-200/70">
                    {sName}
                  </span>
                );
              })}
              {remainingServices > 0 && (
                <span className="rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 px-2 py-1 text-xs font-medium text-gray-600 border border-gray-200/70">
                  +{remainingServices} más
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onEdit(advisor)}
            className="group/btn relative overflow-hidden rounded-2xl bg-blue-100/80 backdrop-blur-sm border border-blue-200/50 px-4 py-3 font-semibold text-blue-700 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-200/80 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-300/50"
          >
            <div className="relative flex items-center justify-center gap-2">
              <svg className="h-4 w-4 transition-transform duration-300 group-hover/btn:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span className="text-sm">Editar</span>
            </div>
          </button>
          
          {onDelete && (
            <button
              onClick={() => onDelete(advisor)}
              className="group/btn relative overflow-hidden rounded-2xl bg-red-100/80 backdrop-blur-sm border border-red-200/50 px-4 py-3 font-semibold text-red-700 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-red-200/80 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-300/50"
            >
              <div className="relative flex items-center justify-center gap-2">
                <svg className="h-4 w-4 transition-transform duration-300 group-hover/btn:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span className="text-sm">Eliminar</span>
              </div>
            </button>
          )}
        </div>
      </div>
      
      {/* Shine effect */}
      <div className="absolute inset-0 -translate-x-full transform bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
    </div>
  );
}
