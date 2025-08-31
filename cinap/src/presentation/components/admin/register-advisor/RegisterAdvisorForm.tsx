"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { InMemoryAdvisorCatalogRepo } from "@infrastructure/advisor-catalog/InMemoryAdvisorCatalogRepo";
import { GetAdvisorCatalog } from "@application/advisor-catalog/usecases/GetAdvisorCatalog";
import type { AdvisorCatalog } from "@domain/advisorCatalog";

import type { AdvisorBasicInfo, AdvisorServiceRef, CategoryId } from "@domain/advisors";
import { InMemoryAdvisorsRepo } from "@infrastructure/advisors/InMemoryAdvisorsRepo";
import { RegisterAdvisor } from "@application/advisors/usecases/RegisterAdvisor";

type Step = 1 | 2 | 3 | 4;

const catalogRepo = new InMemoryAdvisorCatalogRepo();
const ucGetCatalog = new GetAdvisorCatalog(catalogRepo);

const advisorsRepo = new InMemoryAdvisorsRepo();
const ucRegister = new RegisterAdvisor(advisorsRepo);

type CatalogService = {
  id: string;
  name: string;
  description?: string;
  duration?: string;
};

export default function RegisterAdvisorForm() {
  const [step, setStep] = useState<Step>(1);
  const [catalog, setCatalog] = useState<AdvisorCatalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [successOpen, setSuccessOpen] = useState(false);

  const [basic, setBasic] = useState<AdvisorBasicInfo>({ name: "", email: "" });
  const [selectedCategories, setSelectedCategories] = useState<CategoryId[]>([]);
  const [selectedServices, setSelectedServices] = useState<AdvisorServiceRef[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await ucGetCatalog.exec();
      setCatalog(data);
      setLoading(false);
    })();
  }, []);

  const allCategories = useMemo(() => {
    if (!catalog) return [];
    const seen = new Set<string>();
    return [...catalog.active, ...catalog.available]
      .map((c) => c.category)
      .filter((c) => (seen.has(c.id) ? false : (seen.add(c.id), true)));
  }, [catalog]);

  const servicesByCategory = useMemo(() => {
    const m = new Map<string, CatalogService[]>();
    if (!catalog) return m;
    [...catalog.active, ...catalog.available].forEach(({ category, services }) => {
      m.set(category.id, services as CatalogService[]);
    });
    return m;
  }, [catalog]);

  const stepValid = useMemo(() => {
    switch (step) {
      case 1: {
        if (!basic.name.trim()) return false;
        const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(basic.email.trim());
        return emailOk;
      }
      case 2:
        return selectedCategories.length > 0;
      case 3:
        return selectedServices.length > 0;
      case 4:
        return true;
      default:
        return false;
    }
  }, [step, basic, selectedCategories, selectedServices]);

  const goNext = () => setStep((s) => (s < 4 ? ((s + 1) as Step) : s));
  const goPrev = () => setStep((s) => (s > 1 ? ((s - 1) as Step) : s));

  const toggleCategory = (id: CategoryId) => {
    setSelectedServices((prev) => prev.filter((s) => s.categoryId !== id));
    setSelectedCategories((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleService = (svc: AdvisorServiceRef) => {
    setSelectedServices((prev) => {
      const key = `${svc.categoryId}__${svc.id}`;
      const exists = prev.some((p) => `${p.categoryId}__${p.id}` === key);
      return exists ? prev.filter((p) => `${p.categoryId}__${p.id}` !== key) : [...prev, svc];
    });
  };

  const handleRegister = async () => {
    await ucRegister.exec({ basic, categories: selectedCategories, services: selectedServices });
    setSuccessOpen(true);
  };

  const resetAll = () => {
    setStep(1);
    setBasic({ name: "", email: "" });
    setSelectedCategories([]);
    setSelectedServices([]);
    setSuccessOpen(false);
  };

  if (loading) {
    return (
      <div className="mx-auto mt-4 max-w-[900px] rounded-2xl border border-slate-200 bg-white p-8 text-center text-neutral-500">
        Cargando…
      </div>
    );
  }

  return (
    <section
      className="mx-auto mt-4 max-w-[900px] overflow-hidden rounded-2xl bg-white
                 shadow-[0_10px_30px_rgba(0,0,0,0.08)] ring-1 ring-slate-100
                 mb-24 md:mb-28"
    >
      {/* Progress bar con etiquetas */}
      <div className="border-b border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 px-6 py-5">
        <ProgressBar current={step} />
      </div>

      {/* Paso 1 */}
      {step === 1 && (
        <SectionCard>
          <StepHeader title="Información del asesor" subtitle="Ingresa los datos básicos del nuevo asesor" />
          <div className="mx-auto max-w-[700px]">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Nombre completo *">
                <input
                  className="w-full rounded-xl border-2 border-slate-200 p-3 text-black placeholder:text-slate-400 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  placeholder="Ej: Dr. Juan Carlos Pérez"
                  value={basic.name}
                  onChange={(e) => setBasic((b) => ({ ...b, name: e.target.value }))}
                />
              </Field>
              <Field label="Correo electrónico *">
                <input
                  type="email"
                  className="w-full rounded-xl border-2 border-slate-200 p-3 text-black placeholder:text-slate-400 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  placeholder="juan.perez@universidad.edu"
                  value={basic.email}
                  onChange={(e) => setBasic((b) => ({ ...b, email: e.target.value }))}
                />
              </Field>
            </div>
          </div>
        </SectionCard>
      )}

      {/* Paso 2 */}
      {step === 2 && (
        <SectionCard>
          <StepHeader title="Seleccionar categorías" subtitle="Elige las categorías en las que el asesor puede brindar apoyo" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {allCategories.map((c) => {
              const active = selectedCategories.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleCategory(c.id)}
                  className={`w-full rounded-2xl border-2 p-5 text-left transition ${
                    active ? "border-blue-600 bg-blue-50" : "border-slate-200 bg-white hover:border-blue-500"
                  }`}
                >
                  <div className="mb-2 text-3xl">{c.icon}</div>
                  <div className="mb-1 text-lg font-semibold text-neutral-900">{c.name}</div>
                  <div className="text-sm text-neutral-600">{c.description}</div>
                </button>
              );
            })}
          </div>
        </SectionCard>
      )}

      {/* Paso 3 */}
      {step === 3 && (
        <SectionCard>
          <StepHeader title="Seleccionar servicios" subtitle="Elige los servicios específicos que el asesor puede ofrecer" />
          <div className="space-y-6">
            {selectedCategories.map((catId) => {
              const cat = allCategories.find((c) => c.id === catId);
              const services = servicesByCategory.get(catId) ?? [];
              return (
                <div key={`sec__${catId}`} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center gap-2 text-lg font-semibold text-neutral-900">
                    <span className="text-2xl">{cat?.icon}</span>
                    <span>{cat?.name}</span>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {services.map((s) => {
                      const ref = { id: s.id, categoryId: catId };
                      const key = `${catId}__${s.id}`;
                      const active = selectedServices.some((p) => `${p.categoryId}__${p.id}` === key);
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => toggleService(ref)}
                          className={`w-full rounded-xl border-2 p-4 text-left transition ${
                            active ? "border-blue-600 bg-white shadow-sm" : "border-slate-200 bg-white hover:border-blue-500"
                          }`}
                        >
                          <div className="font-semibold text-neutral-900">{s.name}</div>
                          {s.description && <div className="text-sm text-neutral-600">{s.description}</div>}
                          {s.duration && (
                            <span className="mt-2 inline-block rounded-md bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-800">
                              {s.duration}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}

      {/* Paso 4 */}
      {step === 4 && (
        <SectionCard>
          <StepHeader title="Confirmar registro" subtitle="Revisa la información antes de registrar al asesor" />
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h3 className="mb-4 text-center text-xl font-bold text-neutral-900">Resumen del asesor</h3>

            <div className="mb-5 flex items-center gap-4 rounded-xl bg-slate-50 p-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-xl font-bold text-white">
                {initials(basic.name)}
              </div>
              <div>
                <div className="text-lg font-semibold text-neutral-900">{basic.name}</div>
                <div className="text-sm text-neutral-900">{basic.email}</div>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="mb-2 text-sm font-semibold text-neutral-900">Categorías asignadas</h4>
              <div className="flex flex-wrap gap-2">
                {selectedCategories.map((id) => {
                  const c = allCategories.find((x) => x.id === id);
                  return (
                    <span key={`sum-cat-${id}`} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                      {c?.icon} {c?.name}
                    </span>
                  );
                })}
              </div>
            </div>

            <div>
              <h4 className="mb-2 text-sm font-semibold text-neutral-900">Servicios seleccionados</h4>
              <div className="flex flex-wrap gap-2">
                {selectedServices.map((s) => {
                  const svc = servicesByCategory.get(s.categoryId)?.find((x) => x.id === s.id) ?? null;
                  return (
                    <span key={`sum-svc-${s.categoryId}__${s.id}`} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                      {svc?.name}
                      {svc?.duration ? ` (${svc.duration})` : ""}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </SectionCard>
      )}

      {/* Navegación */}
      <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5 md:flex-row">
        <button
          onClick={goPrev}
          disabled={step <= 1}
          aria-disabled={step <= 1}
          className={`inline-flex items-center gap-2 rounded-full border-2 px-5 py-3 font-semibold transition
            ${step <= 1
              ? "cursor-not-allowed border-slate-100 text-slate-300"
              : "border-slate-200 text-neutral-700 hover:border-blue-600 hover:text-blue-600"}`}
        >
          ← Anterior
        </button>

        {step < 4 ? (
          <button
            onClick={goNext}
            disabled={!stepValid}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 px-6 py-3 font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            Siguiente →
          </button>
        ) : (
          <button
            onClick={handleRegister}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 px-6 py-3 font-semibold text-white shadow-sm transition"
          >
            Registrar asesor
          </button>
        )}
      </div>

      {/* Modal éxito */}
      {successOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">
            <div className="mb-2 text-5xl">✅</div>
            <h3 className="mb-1 text-xl font-bold text-neutral-900">¡Asesor registrado exitosamente!</h3>
            <p className="mb-6 text-sm text-neutral-600">Se registró en el sistema.</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <button
                onClick={resetAll}
                className="rounded-full border-2 border-slate-200 px-5 py-2 font-semibold text-neutral-700 transition hover:border-blue-600 hover:text-blue-600"
              >
                Registrar otro
              </button>
              <Link href="/dashboard?role=admin" className="rounded-full bg-gradient-to-br from-blue-600 to-blue-700 px-5 py-2 font-semibold text-white">
                Ir al dashboard
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/* ─────────── UI helpers internos ─────────── */

function SectionCard({ children }: { children: React.ReactNode }) {
  return <section className="p-6">{children}</section>;
}

function StepHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6 text-center">
      <h2 className="text-2xl font-bold text-neutral-900">{title}</h2>
      <p className="text-neutral-600">{subtitle}</p>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`flex flex-col gap-1 ${full ? "md:col-span-2" : ""}`}>
      <span className="text-sm font-semibold text-black">{label}</span>
      {children}
    </label>
  );
}

function ProgressBar({ current }: { current: Step }) {
  const items = [
    { n: 1 as Step, label: "Datos" },
    { n: 2 as Step, label: "Categorías" },
    { n: 3 as Step, label: "Servicios" },
    { n: 4 as Step, label: "Confirmar" },
  ];

  return (
    <div className="flex items-center justify-center gap-3">
      {items.map(({ n, label }, i) => {
        const isActive = current === n;
        const isDone = current > n;
        return (
          <div key={n} className="flex items-center gap-3">
            <div
              className={[
                "flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold",
                isActive && "bg-gradient-to-br from-blue-600 to-blue-700 text-white",
                isDone && "bg-emerald-500 text-white",
                !isActive && !isDone && "bg-slate-200 text-slate-600",
              ].join(" ")}
            >
              {n}
            </div>
            <span
              className={[
                "text-sm font-semibold",
                isActive && "text-blue-700",
                isDone && "text-emerald-600",
                !isActive && !isDone && "text-slate-500",
              ].join(" ")}
            >
              {label}
            </span>
            {i < items.length - 1 && (
              <div className={`h-[2px] w-16 md:w-24 ${isDone ? "bg-emerald-500" : "bg-slate-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function initials(name: string) {
  const i = name
    .trim()
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
  return i || "US";
}
