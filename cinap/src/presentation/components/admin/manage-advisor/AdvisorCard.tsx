"use client";
import React from "react";
import type { Advisor, AdvisorServiceRef, CategoryId } from "@domain/advisors";

function initials(name: string) {
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
  onDelete: (a: Advisor) => void;
};

export default function AdvisorCard({ advisor, categoriesById, servicesByCat, onEdit, onDelete }: Props) {
  const totalServices = advisor.services.length;
  const visibleServices = advisor.services.slice(0, 3);
  const remainingServices = Math.max(0, totalServices - 3);

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-blue-200/40 bg-gradient-to-br from-white via-blue-50/30 to-yellow-50/20 shadow-lg backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:scale-105 hover:shadow-2xl hover:border-blue-300/60">
      {/* Decorative elements */}
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br from-yellow-400/20 to-blue-400/20 blur-xl transition-all duration-500 group-hover:scale-150 group-hover:bg-gradient-to-br group-hover:from-yellow-500/30 group-hover:to-blue-500/30" />
      
      {/* Status indicators */}
      <div className="absolute right-4 top-4 flex gap-2">
        <div className="h-2 w-2 rounded-full bg-gradient-to-r from-green-400 to-green-500 shadow-sm animate-pulse" />
        <div className="rounded-full bg-blue-600/10 px-2 py-0.5 text-xs font-bold text-blue-800">{advisor.categories.length}</div>
      </div>

      {/* Main content */}
      <div className="relative p-6">
        {/* Avatar and basic info */}
        <div className="mb-5 flex items-start gap-4">
          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-400 via-yellow-500 to-blue-600 text-xl font-bold text-white shadow-xl transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3">
              {initials(advisor.basic.name)}
            </div>
            {/* Expertise badge */}
            <div className="absolute -bottom-1 -right-1 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 p-1.5 shadow-lg">
              <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-blue-900 transition-colors group-hover:text-blue-700">{advisor.basic.name}</h3>
            <p className="mt-1 text-sm text-blue-700/80 font-medium truncate">{advisor.basic.email}</p>
            
            {/* Role badge */}
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-yellow-100 to-blue-100 px-3 py-1 text-xs font-semibold text-blue-800 border border-yellow-200/50">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Asesor Certificado
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="mb-4 space-y-2">
          <h4 className="text-xs font-semibold text-blue-800 uppercase tracking-wider">Especialidades</h4>
          <div className="flex flex-wrap gap-2">
            {advisor.categories.slice(0, 3).map((cid) => {
              const c = categoriesById.get(cid as string);
              return (
                <span
                  key={cid}
                  className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-100 to-blue-200 px-3 py-1 text-xs font-semibold text-blue-800 border border-blue-300/50 transition-all duration-200 hover:scale-105"
                  title={c?.name}
                >
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {c?.name ?? cid}
                </span>
              );
            })}
            {advisor.categories.length > 3 && (
              <span className="inline-flex items-center rounded-full bg-gradient-to-r from-gray-100 to-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 border border-gray-300/50">
                +{advisor.categories.length - 3} más
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
              {visibleServices.map((s) => {
                const sName = servicesByCat.get(s.categoryId)?.find((x) => x.id === s.id)?.name ?? s.id;
                return (
                  <span key={`${s.categoryId}_${s.id}`} className="rounded-lg bg-gradient-to-r from-yellow-50 to-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800 border border-yellow-200/70">
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
            className="group/btn relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 px-4 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-700 via-blue-800 to-blue-900 opacity-0 transition-opacity duration-300 group-hover/btn:opacity-100" />
            <div className="relative flex items-center justify-center gap-2">
              <svg className="h-4 w-4 transition-transform duration-300 group-hover/btn:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span className="text-sm">Editar</span>
            </div>
          </button>
          
          <button
            onClick={() => onDelete(advisor)}
            className="group/btn relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-500 via-red-600 to-red-700 px-4 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-red-300"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-red-700 to-red-800 opacity-0 transition-opacity duration-300 group-hover/btn:opacity-100" />
            <div className="relative flex items-center justify-center gap-2">
              <svg className="h-4 w-4 transition-transform duration-300 group-hover/btn:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span className="text-sm">Eliminar</span>
            </div>
          </button>
        </div>
      </div>
      
      {/* Shine effect */}
      <div className="absolute inset-0 -translate-x-full transform bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
    </div>
  );
}
