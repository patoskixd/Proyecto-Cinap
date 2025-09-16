"use client";
import type { Category, CategoryId, Service } from "../types";
import { cx } from "../utils/cx";

type Props = {
  categories: Category[];
  servicesByCategory: Record<CategoryId, Service[]>;
  categoryId?: CategoryId;
  serviceId?: string;
  setCategoryId(id?: CategoryId): void;
  setServiceId(id?: string): void;
};

export default function Step1Service({
  categories, servicesByCategory, categoryId, serviceId, setCategoryId, setServiceId
}: Props) {
  const services: Service[] = categoryId ? (servicesByCategory[categoryId] ?? []) : [];

  return (
    <div className="space-y-10 p-6 md:p-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-neutral-900">Selecciona categoría y servicio</h2>
        <p className="text-neutral-600">Elige la categoría y el tipo de servicio para tus cupos</p>
      </div>

      <section>
        <h3 className="mb-4 border-b-2 border-slate-200 pb-2 text-lg font-semibold text-neutral-900">1. Categoría</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => { setCategoryId(c.id); setServiceId(undefined); }}
              className={cx(
                "rounded-2xl border-2 p-5 text-left transition hover:-translate-y-1 hover:shadow-md",
                categoryId === c.id ? "border-blue-600 bg-blue-50/40" : "border-slate-200 bg-white"
              )}
            >
              <div className="mb-2 text-3xl">{c.icon}</div>
              <h4 className="font-semibold text-neutral-900">{c.name}</h4>
              <p className="text-sm text-neutral-600">{c.description}</p>
            </button>
          ))}
        </div>
      </section>

      {categoryId && (
        <section>
          <h3 className="mb-4 border-b-2 border-slate-200 pb-2 text-lg font-semibold text-neutral-900">2. Servicio</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {services.map((s) => (
              <button
                key={s.id}
                onClick={() => setServiceId(s.id)}
                className={cx(
                  "rounded-2xl border-2 p-5 text-left transition hover:-translate-y-1 hover:shadow-md",
                  serviceId === s.id ? "border-blue-600 bg-blue-50/40" : "border-slate-200 bg-white"
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
    </div>
  );
}
