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
        <h2 className="text-2xl font-bold text-blue-900">Selecciona tu asesoría</h2>
        <p className="text-blue-700">
          Elige la categoría, servicio y asesor que mejor se adapte a tus necesidades
        </p>
      </div>

      {/* Categorías */}
      <section>
        <h3 className="mb-4 border-b-2 border-blue-200 pb-2 text-lg font-semibold text-blue-900">
          1. Categoría
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => selectCategory(c.id)}
              className={cx(
                "rounded-2xl border-2 p-5 text-left transition",
                "hover:-translate-y-1 hover:shadow-lg",
                state.categoryId === c.id 
                  ? "border-blue-600 bg-gradient-to-br from-blue-50 to-blue-100 shadow-md" 
                  : "border-slate-200 bg-white hover:border-blue-300"
              )}
            >
              <h4 className={cx(
                "font-semibold text-lg",
                state.categoryId === c.id ? "text-blue-900" : "text-neutral-900"
              )}>{c.name}</h4>
              <p className={cx(
                "text-sm mt-2",
                state.categoryId === c.id ? "text-blue-700" : "text-neutral-600"
              )}>{c.description}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Servicios */}
      {state.categoryId && (
        <section>
          <h3 className="mb-4 border-b-2 border-blue-200 pb-2 text-lg font-semibold text-blue-900">
            2. Servicio
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {services.map((s) => (
              <button
                key={s.id}
                onClick={() => selectService(s.id)}
                className={cx(
                  "rounded-2xl border-2 p-5 text-left transition",
                  "hover:-translate-y-1 hover:shadow-lg",
                  state.serviceId === s.id 
                    ? "border-yellow-500 bg-gradient-to-br from-yellow-50 to-yellow-100 shadow-md" 
                    : "border-slate-200 bg-white hover:border-yellow-300"
                )}
              >
                <h4 className={cx(
                  "font-semibold",
                  state.serviceId === s.id ? "text-yellow-900" : "text-neutral-900"
                )}>{s.name}</h4>
                <p className={cx(
                  "text-sm",
                  state.serviceId === s.id ? "text-yellow-700" : "text-neutral-600"
                )}>{s.description}</p>
                <span className={cx(
                  "mt-3 inline-block rounded-full px-2.5 py-1 text-xs font-bold",
                  state.serviceId === s.id 
                    ? "bg-yellow-200 text-yellow-800" 
                    : "bg-blue-50 text-blue-600"
                )}>
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
          <h3 className="mb-4 border-b-2 border-blue-200 pb-2 text-lg font-semibold text-blue-900">
            3. Asesor
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {advisors.map((a) => (
              <button
                key={a.id}
                onClick={() => selectAdvisor(a.id)}
                className={cx(
                  "rounded-2xl border-2 p-5 text-left transition",
                  "hover:-translate-y-1 hover:shadow-lg",
                  state.advisorId === a.id 
                    ? "border-blue-600 bg-gradient-to-br from-blue-50 to-blue-100 shadow-md" 
                    : "border-slate-200 bg-white hover:border-blue-300"
                )}
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-base font-bold text-white shadow-sm">
                    {a.name
                      .split(" ")
                      .map((p: string) => p[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div>
                    <h4 className={cx(
                      "font-semibold",
                      state.advisorId === a.id ? "text-blue-900" : "text-neutral-900"
                    )}>{a.name}</h4>
                    <p className={cx(
                      "text-sm",
                      state.advisorId === a.id ? "text-blue-700" : "text-neutral-600"
                    )}>{a.email}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {a.specialties.map((sp: string) => (
                    <span
                      key={sp}
                      className={cx(
                        "rounded-md border px-2 py-0.5 text-xs font-semibold",
                        state.advisorId === a.id 
                          ? "border-yellow-200 bg-yellow-50 text-yellow-700"
                          : "border-emerald-200 bg-emerald-50 text-emerald-600"
                      )}
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
