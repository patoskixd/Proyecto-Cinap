"use client";

import { useEffect, useState, useMemo } from "react";
import { InMemoryAdvisorCatalogRepo } from "@infrastructure/advisor-catalog/InMemoryAdvisorCatalogRepo";
import { GetAdvisorCatalog } from "@application/advisor-catalog/usecases/GetAdvisorCatalog";
import { JoinAdvisorCategory } from "@application/advisor-catalog/usecases/JoinAdvisorCategory";
import { LeaveAdvisorCategory } from "@application/advisor-catalog/usecases/LeaveAdvisorCategory";
import type { AdvisorCatalog } from "@domain/advisorCatalog";
import { CategoryId } from "@/domain/scheduling";


const MAX_CHIPS = 4;

function dedupServices<T extends { id: string; name: string }>(arr: T[]): T[] {
  const seen = new Set<string>();
  return arr.filter((s) => {
    const key = `${s.id}::${s.name}`; 
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const repo = new InMemoryAdvisorCatalogRepo();
const ucGet = new GetAdvisorCatalog(repo);
const ucJoin = new JoinAdvisorCategory(repo);
const ucLeave = new LeaveAdvisorCategory(repo);

export default function ManageCategories() {
  const [data, setData] = useState<AdvisorCatalog | null>(null);
  const [toast, setToast] = useState<{ msg: string; tone: "success" | "error" } | null>(null);


  const [servicesModal, setServicesModal] = useState<{
    categoryId: string;
    title: string;
    services: { id: string; name: string; description?: string; duration?: number }[];
  } | null>(null);


  const [confirmLeave, setConfirmLeave] = useState<{ categoryId: string; title: string } | null>(null);

  const notify = (msg: string, tone: "success" | "error" = "success") => {
    setToast({ msg, tone });
    setTimeout(() => setToast(null), 2600);
  };

  const refresh = async () => setData(await ucGet.exec());
  useEffect(() => {
    refresh();
  }, []);

  const { active, available, stats } = useMemo(
    () => ({
      active: data?.active ?? [],
      available: data?.available ?? [],
      stats: data?.stats ?? { activeCategories: 0, activeServices: 0 },
    }),
    [data],
  );

  const join = async (categoryId: string) => {
    await ucJoin.exec({ categoryId: categoryId as CategoryId });
    await refresh();
    const cat = data?.available.find((c) => c.category.id === categoryId)?.category.name;
    notify(`Te uniste a "${cat ?? "la categoría"}"`, "success");
  };

  const leave = async () => {
    if (!confirmLeave) return;
    await ucLeave.exec({ categoryId: confirmLeave.categoryId as CategoryId });
    await refresh();
    notify(`Saliste de "${confirmLeave.title}"`, "success");
    setConfirmLeave(null);
  };

  if (!data) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-neutral-500">
        Cargando…
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Gestionar categorías y servicios</h1>
          <p className="text-neutral-600">
            Administra las categorías y servicios en los que participas para ofrecer asesorías
          </p>
        </div>
        <div className="flex gap-3">
          <Stat number={stats.activeCategories} label="Categorías activas" />
          <Stat number={stats.activeServices} label="Servicios activos" />
        </div>
      </header>

      {/* Activas */}
      <section>
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-neutral-900">Mis categorías y servicios actuales</h2>
          <p className="text-sm text-neutral-600">Categorías y servicios en los que actualmente ofreces asesorías</p>
        </div>

        {active.length === 0 ? (
          <Empty text="No tienes categorías activas" />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {active.map(({ category, services }) => {
              const uniq = dedupServices(services as any);
              const chips = uniq.slice(0, MAX_CHIPS);
              const hidden = Math.max(uniq.length - MAX_CHIPS, 0);

              return (
                <div key={category.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="text-3xl">{category.icon}</div>
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-700">
                      Activa
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-neutral-900">{category.name}</h3>
                  <p className="mb-4 text-sm leading-relaxed text-neutral-600">{category.description}</p>

                  <div className="mb-5 flex flex-wrap gap-2">
                    {chips.map((s, i) => (
                      <span
                        key={`${category.id}-${s.id}-${i}`}
                        className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                      >
                        {s.name}
                      </span>
                    ))}
                    {hidden > 0 && (
                      <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        +{hidden} más
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() =>
                        setServicesModal({
                          categoryId: category.id,
                          title: category.name,
                          services: uniq as any,
                        })
                      }
                      className="rounded-full border-2 border-slate-200 px-4 py-2 text-sm font-semibold text-neutral-700 hover:border-blue-600 hover:text-blue-600"
                    >
                      Ver servicios
                    </button>
                    <button
                      onClick={() => setConfirmLeave({ categoryId: category.id, title: category.name })}
                      className="rounded-full border-2 border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-600 hover:text-white"
                    >
                      Salir de categoría
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Disponibles */}
      <section>
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-neutral-900">Categorías y servicios disponibles</h2>
          <p className="text-sm text-neutral-600">Únete a nuevas categorías para expandir tus servicios de asesoría</p>
        </div>

        {available.length === 0 ? (
          <Empty text="No hay categorías disponibles por ahora" />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {available.map(({ category, services }) => {
              const uniq = dedupServices(services as any);
              const chips = uniq.slice(0, MAX_CHIPS);
              const hidden = Math.max(uniq.length - MAX_CHIPS, 0);

              return (
                <div key={category.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="text-3xl">{category.icon}</div>
                    <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-blue-700">
                      Disponible
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-neutral-900">{category.name}</h3>
                  <p className="mb-4 text-sm leading-relaxed text-neutral-600">{category.description}</p>

                  <div className="mb-5 flex flex-wrap gap-2">
                    {chips.map((s, i) => (
                      <span
                        key={`${category.id}-${s.id}-${i}`}
                        className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
                      >
                        {s.name}
                      </span>
                    ))}
                    {hidden > 0 && (
                      <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        +{hidden} más
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => join(category.id)}
                      className="rounded-full bg-gradient-to-br from-blue-600 to-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm"
                    >
                      Unirse a categoría
                    </button>
                    <button
                      onClick={() =>
                        setServicesModal({
                          categoryId: category.id,
                          title: category.name,
                          services: uniq as any,
                        })
                      }
                      className="rounded-full border-2 border-slate-200 px-4 py-2 text-sm font-semibold text-neutral-700 hover:border-blue-600 hover:text-blue-600"
                    >
                      Ver servicios
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Modal: Ver servicios */}
      {servicesModal && (
        <Modal onClose={() => setServicesModal(null)} title={`Servicios — ${servicesModal.title}`}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {servicesModal.services.map((s, i) => (
              <div
                key={`${servicesModal.categoryId}-${s.id}-${i}`}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="mb-1 text-sm font-semibold text-neutral-900">{s.name}</div>
                {s.description && <div className="text-xs text-neutral-600">{s.description}</div>}
                {typeof (s as any).duration !== "undefined" && (
                  <div className="mt-2 inline-block rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                    {(s as any).duration} min
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setServicesModal(null)}
              className="rounded-full border-2 border-slate-200 px-4 py-2 text-sm font-semibold text-neutral-700 hover:border-blue-600 hover:text-blue-600"
            >
              Cerrar
            </button>
          </div>
        </Modal>
      )}

      {/* Modal: Confirmar salir */}
      {confirmLeave && (
        <Modal onClose={() => setConfirmLeave(null)} title="Salir de categoría">
          <p className="text-sm text-neutral-700">
            ¿Seguro que deseas salir de <span className="font-semibold">{confirmLeave.title}</span>? Dejarás de ofrecer
            asesorías en esta categoría.
          </p>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setConfirmLeave(null)}
              className="flex-1 rounded-full border-2 border-slate-200 px-4 py-2 text-sm font-semibold text-neutral-700 hover:border-blue-600 hover:text-blue-600"
            >
              Cancelar
            </button>
            <button
              onClick={leave}
              className="flex-1 rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
            >
              Sí, salir
            </button>
          </div>
        </Modal>
      )}

      {/* toast */}
      {toast && (
        <div
          className={`fixed right-4 top-24 z-[60] rounded-md px-4 py-2 text-white shadow-lg ${
            toast.tone === "success" ? "bg-emerald-600" : "bg-rose-600"
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}



function Stat({ number, label }: { number: number; label: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
      <div className="text-center">
        <div className="text-2xl font-bold text-blue-600">{number}</div>
        <div className="text-xs font-medium text-neutral-600">{label}</div>
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
      <div className="mb-2 text-4xl opacity-70">📭</div>
      <p className="text-sm text-neutral-600">{text}</p>
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  // cierre con ESC
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-3">
      <div className="relative w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-xl">
        {/* header sticky para móviles */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <h3 className="text-base font-semibold text-neutral-900">{title}</h3>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-md text-xl text-neutral-500 hover:bg-slate-100"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        {/* contenido con scroll */}
        <div className="max-h-[75vh] overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
