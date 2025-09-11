"use client";

import { useMemo, useState } from "react";
import { useAdvisorCatalog } from "./hooks/useAdvisorCatalog";
import ActiveCategoryCard from "./components/ActiveCategoryCard";
import AvailableCategoryCard from "./components/AvailableCategoryCard";
import ServicesModal from "./components/ServicesModal";
import CatalogStats from "./components/Stat";
import SectionCard from "./components/SectionCard";

const MAX_CHIPS = 2;

export default function AdvisorCategories() {
  const { data, loading, error, refresh } = useAdvisorCatalog();
  const [servicesModal, setServicesModal] = useState<{
    categoryId: string;
    title: string;
    services: { id: string; name: string; description?: string; duration?: number; selected?: boolean }[];
  } | null>(null);

  const active = data?.active ?? [];
  const available = data?.available ?? [];
  const stats = data?.stats ?? { activeCategories: 0, activeServices: 0 };

  const totals = useMemo(() => {
    const totalCategories = active.length + available.length;
    const totalServices =
      active.reduce((acc, x) => acc + (x.services?.length ?? 0), 0) +
      available.reduce((acc, x) => acc + (x.services?.length ?? 0), 0);
    return {
      totalCategories,
      activeCategories: stats.activeCategories,
      activeServices: stats.activeServices,
      totalServices,
    };
  }, [active, available, stats]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-neutral-500">
        <span className="text-black">Cargando… </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-700">
        {error}
        <div className="mt-4">
          <button onClick={refresh} className="rounded-full border px-4 py-2 text-sm">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-neutral-500">
        No hay datos para mostrar.
      </div>
    );
  }

  return (
    <div className="py-6">
      {/* Header */}
      <div className="mb-6">
        <section className="rounded-2xl bg-white p-6 md:p-8 shadow-[0_10px_30px_rgba(0,0,0,0.06)] ring-1 ring-slate-100">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">Catálogo de categorías y servicios</h1>
              <p className="mt-1 text-neutral-600">Visualiza las categorías y servicios asociados a tu perfil.</p>
            </div>
          </div>
        </section>
      </div>

      {/* Stats */}
      <CatalogStats
        totalCategorias={totals.totalCategories}
        categoriasActivas={totals.activeCategories}
        serviciosActivos={totals.activeServices}
        serviciosTotales={totals.totalServices}
      />

      {/*  Categorías activas */}
      <SectionCard
        title="Mis categorías activas"
        subtitle="Servicios en los que actualmente ofreces asesorías"
        className="mt-6"
      >
        {active.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <h3 className="mb-1 text-lg font-semibold text-neutral-900">No tienes categorías activas</h3>
            <p className="text-neutral-600">Consulta las categorías disponibles más abajo</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {active.map(({ category, services }) => (
              <ActiveCategoryCard
                key={category.id}
                category={category}
                services={services}
                maxChips={MAX_CHIPS}
                onViewServices={() =>
                  setServicesModal({
                    categoryId: category.id,
                    title: category.name,
                    services,
                  })
                }
              />
            ))}
          </div>
        )}
      </SectionCard>

      {/*  Otras categorías) */}
      <SectionCard
        title="Otras categorías del catálogo"
        subtitle="Consulta servicios disponibles en otras categorías"
        className="mt-8"
      >
        {available.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <h3 className="mb-1 text-lg font-semibold text-neutral-900">No hay categorías para mostrar</h3>
            <p className="text-neutral-600">Vuelve más tarde para ver nuevas categorías</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {available.map(({ category, services }) => (
              <AvailableCategoryCard
                key={category.id}
                category={category}
                services={services}
                maxChips={MAX_CHIPS}
                onViewServices={() =>
                  setServicesModal({
                    categoryId: category.id,
                    title: category.name,
                    services,
                  })
                }
              />
            ))}
          </div>
        )}
      </SectionCard>

      {/* Servicios */}
      {servicesModal && (
        <ServicesModal
          title={`Servicios — ${servicesModal.title}`}
          services={servicesModal.services}
          onClose={() => setServicesModal(null)}
        />
      )}
    </div>
  );
}
