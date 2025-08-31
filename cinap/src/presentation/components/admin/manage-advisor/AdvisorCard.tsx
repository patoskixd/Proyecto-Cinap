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
  return (
    <div className="rounded-2xl bg-white p-5 shadow-[0_6px_20px_rgba(0,0,0,0.08)] ring-1 ring-slate-100">
      <div className="mb-3 flex items-start gap-3">
        <div className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-xl bg-blue-600 text-sm font-bold text-white">
          {initials(advisor.basic.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-lg font-semibold text-neutral-900">{advisor.basic.name}</div>
          <div className="truncate text-sm text-neutral-600">{advisor.basic.email}</div>

          {/* categorías */}
          <div className="mt-2 flex flex-wrap gap-2">
            {advisor.categories.map((cid) => {
              const c = categoriesById.get(cid as string);
              return (
                <span
                  key={cid}
                  className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                  title={c?.name}
                >
                  {c?.name ?? cid}
                </span>
              );
            })}
          </div>

          {/* servicios */}
          {!!advisor.services.length && (
            <div className="mt-2 flex flex-wrap gap-2">
              {advisor.services.slice(0, 6).map((s) => {
                const sName = servicesByCat.get(s.categoryId)?.find((x) => x.id === s.id)?.name ?? s.id;
                return (
                  <span key={`${s.categoryId}_${s.id}`} className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
                    {sName}
                  </span>
                );
              })}
              {advisor.services.length > 6 && (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  +{advisor.services.length - 6} más
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={() => onEdit(advisor)}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
        >
          ✏️ Editar
        </button>
        <button
          onClick={() => onDelete(advisor)}
          className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
        >
          🗑️ Eliminar
        </button>
      </div>
    </div>
  );
}
