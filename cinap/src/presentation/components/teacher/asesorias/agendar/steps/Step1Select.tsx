"use client";

import type { Advisor, Category, CategoryId, Service } from "../types";
import { cx } from "../utils/cx";

export function Step1Select({
  categories,
  services,
  advisors,
  state,
  selectCategory,
  selectService,
  selectAdvisor,
}: {
  categories: Category[];
  services: Service[];
  advisors: Advisor[];
  state: { categoryId?: CategoryId; serviceId?: string; advisorId?: string };
  selectCategory: (id: CategoryId) => void;
  selectService: (id: string) => void;
  selectAdvisor: (id: string) => void;
}) {
  return (
    <div className="space-y-10 p-6 md:p-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-neutral-900">Selecciona tu asesoría</h2>
        <p className="text-neutral-600">
          Elige la categoría, servicio y asesor que mejor se adapte a tus necesidades
        </p>
      </div>

      {/* Categorías */}
      <section>
        <h3 className="mb-4 border-b-2 border-slate-200 pb-2 text-lg font-semibold text-neutral-900">
          1. Categoría
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => selectCategory(c.id)}
              className={cx(
                "rounded-2xl border-2 p-5 text-left transition",
                "hover:-translate-y-1 hover:shadow-md",
                state.categoryId === c.id ? "border-blue-600 bg-blue-50/40" : "border-slate-200 bg-white"
              )}
            >
              <div className="mb-2 text-3xl">{c.icon}</div>
              <h4 className="font-semibold text-neutral-900">{c.name}</h4>
              <p className="text-sm text-neutral-600">{c.description}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Servicios */}
      {state.categoryId && (
        <section>
          <h3 className="mb-4 border-b-2 border-slate-200 pb-2 text-lg font-semibold text-neutral-900">
            2. Servicio
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {services.map((s) => (
              <button
                key={s.id}
                onClick={() => selectService(s.id)}
                className={cx(
                  "rounded-2xl border-2 p-5 text-left transition",
                  "hover:-translate-y-1 hover:shadow-md",
                  state.serviceId === s.id ? "border-blue-600 bg-blue-50/40" : "border-slate-200 bg-white"
                )}
              >
                <h4 className="font-semibold text-neutral-900">{s.name}</h4>
                <p className="text-sm text-neutral-600">{s.description}</p>
                <span className="mt-3 inline-block rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-600">
                  {s.duration}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Asesores */}
      {state.serviceId && (
        <section>
          <h3 className="mb-4 border-b-2 border-slate-200 pb-2 text-lg font-semibold text-neutral-900">
            3. Asesor
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {advisors.map((a) => (
              <button
                key={a.id}
                onClick={() => selectAdvisor(a.id)}
                className={cx(
                  "rounded-2xl border-2 p-5 text-left transition",
                  "hover:-translate-y-1 hover:shadow-md",
                  state.advisorId === a.id ? "border-blue-600 bg-blue-50/40" : "border-slate-200 bg-white"
                )}
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-base font-bold text-white">
                    {a.name
                      .split(" ")
                      .map((p: string) => p[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-semibold text-neutral-900">{a.name}</h4>
                    <p className="text-sm text-neutral-600">{a.email}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {a.specialties.map((sp: string) => (
                    <span
                      key={sp}
                      className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-600"
                    >
                      {sp}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
