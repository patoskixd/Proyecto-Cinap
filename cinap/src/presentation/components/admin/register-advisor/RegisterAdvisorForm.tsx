"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import type { AdminCategory } from "@/domain/admin/catalog";
import type { 
  AdvisorBasicInfo, 
  AdvisorServiceRef, 
  CategoryId, 
  RegisterAdvisorRequest 
} from "@/domain/admin/advisors";
import { RegisterAdvisor } from "@/application/admin/advisors/usecases/RegisterAdvisor";
import { AdminAdvisorsHttpRepo } from "@/infrastructure/admin/advisors/AdminAdvisorsHttpRepo";
import { AdminCatalogHttpRepo } from "@/infrastructure/admin/catalog/AdminCatalogHttpRepo";
import { notify } from "@/presentation/components/shared/Toast";

type Step = 1 | 2 | 3 | 4;
const createRepos = () => {
  const advisorsRepo = new AdminAdvisorsHttpRepo();
  const catalogRepo = new AdminCatalogHttpRepo();
  return { advisorsRepo, catalogRepo };
};

type CatalogService = {
  id: string;
  name: string;
  description?: string;
  duration?: string;
};



export default function RegisterAdvisorForm() {
  const [step, setStep] = useState<Step>(1);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [successOpen, setSuccessOpen] = useState(false);

  const [basic, setBasic] = useState<AdvisorBasicInfo>({ name: "", email: "" });
  const [selectedCategories, setSelectedCategories] = useState<CategoryId[]>([]);
  const [selectedServices, setSelectedServices] = useState<AdvisorServiceRef[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { catalogRepo } = createRepos();
        const data = await catalogRepo.listCategories();
        setCategories(data);
      } catch (error) {
        console.error(error);
        notify("No se pudieron cargar las categorías. Intenta nuevamente.", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const allCategories = useMemo(() => {
    return categories.filter((c) => c.active);
  }, [categories]);

  const servicesByCategory = useMemo(() => {
    const m = new Map<string, CatalogService[]>();
    categories.forEach((category) => {
      const activeServices = category.services
        .filter((s) => s.active)
        .map((s) => ({
          id: s.id,
          name: s.name,
          description: `Duración: ${s.durationMinutes} minutos`,
          duration: `${s.durationMinutes} min`,
        }));
      m.set(category.id, activeServices);
    });
    return m;
  }, [categories]);

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
    const request: RegisterAdvisorRequest = {
      basic,
      categories: selectedCategories,
      services: selectedServices.map(s => s.id) 
    };
    
    try {
      const { advisorsRepo } = createRepos();
      const ucRegister = new RegisterAdvisor(advisorsRepo);
      await ucRegister.exec(request);
      setSuccessOpen(true);
    } catch (error) {
      let message = "No se pudo registrar el asesor. Intenta de nuevo.";
      if (error instanceof Error) {
        const trimmed = error.message?.trim();
        if (trimmed) {
          message = trimmed;
        }
      } else if (typeof error === "string" && error.trim()) {
        message = error.trim();
      }
      notify(message, "error");
    }
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
      <div className="mx-auto mt-4 max-w-[900px] rounded-2xl bg-white p-8 text-center shadow-lg border">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <span className="text-gray-900 font-semibold">Cargando datos del catálogo…</span>
        </div>
      </div>
    );
  }

  return (
    <section
      className="mx-auto mt-4 max-w-[900px] overflow-hidden rounded-2xl bg-white
                 shadow-[0_10px_30px_rgba(0,0,0,0.08)] ring-1 ring-slate-100
                 mb-8 flex flex-col"
    >
      {/* Progress bar con etiquetas */}
      <div className="border-b border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-5">
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
                  className="w-full rounded-xl border-2 border-blue-300 p-3 text-blue-900 placeholder:text-blue-400 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
                  placeholder="Ej: Dr. Juan Carlos Pérez"
                  value={basic.name}
                  onChange={(e) => setBasic((b) => ({ ...b, name: e.target.value }))}
                />
              </Field>
              <Field label="Correo electrónico *">
                <input
                  type="email"
                  className="w-full rounded-xl border-2 border-blue-300 p-3 text-blue-900 placeholder:text-blue-400 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
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
                  className={`w-full rounded-2xl border-2 p-5 text-left transition hover:-translate-y-1 hover:shadow-lg ${
                    active 
                      ? "border-blue-600 bg-gradient-to-br from-blue-50 to-blue-100 shadow-md" 
                      : "border-slate-200 bg-white hover:border-blue-300"
                  }`}
                >
                  <div className={`text-lg font-semibold ${active ? "text-blue-900" : "text-neutral-900"}`}>{c.name}</div>
                  <div className={`text-sm ${active ? "text-blue-700" : "text-neutral-600"}`}>{c.description}</div>
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
                <div key={`sec__${catId}`} className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-4 shadow-sm">
                  <div className="mb-3 text-lg font-semibold text-blue-900">
                    {cat?.name}
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
                          className={`w-full rounded-xl border-2 p-4 text-left transition hover:-translate-y-1 hover:shadow-md ${
                            active 
                              ? "border-yellow-500 bg-gradient-to-br from-yellow-50 to-yellow-100 shadow-sm" 
                              : "border-slate-200 bg-white hover:border-yellow-300"
                          }`}
                        >
                          <div className={`font-semibold ${active ? "text-yellow-900" : "text-neutral-900"}`}>{s.name}</div>
                          {s.description && <div className={`text-sm ${active ? "text-yellow-700" : "text-neutral-600"}`}>{s.description}</div>}
                          {s.duration && (
                            <span className={`mt-2 inline-block rounded-md px-2 py-0.5 text-xs font-medium ${
                              active ? "bg-yellow-200 text-yellow-800" : "bg-blue-100 text-blue-800"
                            }`}>
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
          <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-white p-6 shadow-md ring-1 ring-blue-200">
            <h3 className="mb-4 text-center text-xl font-bold text-blue-900">Resumen del asesor</h3>

            <div className="mb-5 flex items-center gap-4 rounded-xl bg-gradient-to-r from-blue-100 to-blue-50 p-4 border border-blue-200">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-xl font-bold text-white shadow-lg">
                {initials(basic.name)}
              </div>
              <div>
                <div className="text-lg font-semibold text-blue-900">{basic.name}</div>
                <div className="text-sm text-blue-700">{basic.email}</div>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="mb-2 text-sm font-semibold text-blue-900">Categorías asignadas</h4>
              <div className="flex flex-wrap gap-2">
                {selectedCategories.map((id) => {
                  const c = allCategories.find((x) => x.id === id);
                  return (
                    <span key={`sum-cat-${id}`} className="rounded-full bg-gradient-to-r from-blue-100 to-blue-200 border border-blue-300 px-3 py-1 text-xs font-medium text-blue-800 shadow-sm">
                      {c?.name}
                    </span>
                  );
                })}
              </div>
            </div>

            <div>
              <h4 className="mb-2 text-sm font-semibold text-blue-900">Servicios seleccionados</h4>
              <div className="flex flex-wrap gap-2">
                {selectedServices.map((s) => {
                  const svc = servicesByCategory.get(s.categoryId)?.find((x) => x.id === s.id) ?? null;
                  return (
                    <span key={`sum-svc-${s.categoryId}__${s.id}`} className="rounded-full bg-gradient-to-r from-yellow-100 to-yellow-200 border border-yellow-300 px-3 py-1 text-xs font-medium text-yellow-800 shadow-sm">
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
      <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5 md:flex-row mt-auto">
        <button
          onClick={goPrev}
          disabled={step <= 1}
          aria-disabled={step <= 1}
          className={`inline-flex items-center gap-2 rounded-full border-2 px-5 py-2 font-semibold transition disabled:cursor-not-allowed disabled:opacity-50
            ${step > 1
              ? "border-slate-200 text-neutral-800 hover:border-blue-600 hover:text-blue-600"
              : "border-slate-100 text-slate-300"}`}
        >
          ← Anterior
        </button>

        {step < 4 ? (
          <button
            onClick={goNext}
            disabled={!stepValid}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 px-6 py-3 font-semibold text-white shadow-sm transition disabled:opacity-60"
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
        <div 
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) resetAll();
          }}
        >
          <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden transform animate-in zoom-in-95 duration-200">
            {/* Header con gradiente */}
            <div className="h-16 bg-gradient-to-r from-green-500 via-emerald-600 to-blue-600 relative">
              <div className="absolute inset-0 bg-black/10"></div>
            </div>

            {/* Contenido */}
            <div className="px-6 py-6 -mt-4 relative text-center">
              {/* Ícono de éxito */}
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full shadow-xl border-4 border-white flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">¡Asesor registrado exitosamente!</h3>
              <p className="text-gray-600 mb-6">Se registró en el sistema correctamente.</p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={resetAll}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all duration-200"
                >
                  Registrar otro
                </button>
                <Link 
                  href="/dashboard?role=admin" 
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Ir al dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}



function SectionCard({ children }: { children: React.ReactNode }) {
  return <section className="p-6 min-h-0">{children}</section>;
}

function StepHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6 text-center">
      <h2 className="text-2xl font-bold text-blue-900">{title}</h2>
      <p className="text-blue-700">{subtitle}</p>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`flex flex-col gap-1 ${full ? "md:col-span-2" : ""}`}>
      <span className="text-sm font-semibold text-blue-900">{label}</span>
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
                "flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold shadow-md",
                isActive && "bg-gradient-to-br from-blue-600 to-blue-700 text-white",
                isDone && "bg-gradient-to-br from-yellow-500 to-yellow-600 text-white",
                !isActive && !isDone && "bg-slate-200 text-slate-600",
              ].join(" ")}
            >
              {n}
            </div>
            <span
              className={[
                "hidden text-sm font-semibold md:inline",
                isActive && "text-blue-700",
                isDone && "text-yellow-700",
                !isActive && !isDone && "text-slate-500",
              ].join(" ")}
            >
              {label}
            </span>
            {i < items.length - 1 && (
              <div className={`h-[2px] w-16 md:w-24 ${isDone ? "bg-yellow-400" : "bg-slate-200"}`} />
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
