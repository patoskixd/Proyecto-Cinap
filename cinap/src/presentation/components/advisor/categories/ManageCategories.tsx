"use client";

import { useMemo, useState } from "react";
import { useAdvisorCatalog } from "./hooks/useAdvisorCatalog";
import ActiveCategoryCard from "./components/ActiveCategoryCard";
import AvailableCategoryCard from "./components/AvailableCategoryCard";
import ServicesModal from "./components/ServicesModal";
import CatalogStats from "./components/Stat";
import SectionCard from "./components/SectionCard";

const MAX_CHIPS = 2;
const DEFAULT_STATS = { activeCategories: 0, activeServices: 0 };

export default function AdvisorCategories() {
  const { data, loading, error, refresh } = useAdvisorCatalog();
  const [servicesModal, setServicesModal] = useState<{
    categoryId: string;
    title: string;
    services: { id: string; name: string; description?: string; duration?: number; selected?: boolean }[];
  } | null>(null);

  const active = useMemo(() => data?.active ?? [], [data]);
  const available = useMemo(() => data?.available ?? [], [data]);
  const stats = useMemo(() => data?.stats ?? DEFAULT_STATS, [data]);

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
      <div className="py-6 space-y-6">
        <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-white via-blue-50/30 to-yellow-50/20 p-6 shadow-lg backdrop-blur-sm md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-blue-900">Catálogo de categorías y servicios</h1>
              <p className="mt-1 text-blue-700">Visualiza las categorías y servicios asociados a tu perfil.</p>
            </div>
            <div className="flex items-center gap-3 text-blue-700">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
              <span className="font-medium">Cargando información…</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white shadow-lg ring-1 ring-blue-100 p-8 text-center">
          <div className="flex flex-col items-center gap-3 text-blue-700">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
            <p className="text-sm font-medium">Preparando resumen del catálogo…</p>
            <p className="text-xs text-blue-600/80">Obteniendo tus categorías y servicios activos.</p>
          </div>
        </div>

        <SectionCard
          title="Mis categorías activas"
          subtitle="Servicios en los que actualmente ofreces asesorías"
          className="mt-6"
        >
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
              <p className="text-sm font-medium text-blue-700">Cargando categorías activas…</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Otras categorías del catálogo"
          subtitle="Consulta servicios disponibles en otras categorías"
          className="mt-8"
        >
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
              <p className="text-sm font-medium text-blue-700">Cargando otras categorías…</p>
            </div>
          </div>
        </SectionCard>
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
      <div className="mb-6 rounded-2xl border border-blue-200 bg-gradient-to-br from-white via-blue-50/30 to-yellow-50/20 p-6 shadow-lg backdrop-blur-sm md:mb-8 md:p-8">
        <div>
          <h1 className="text-3xl font-bold text-blue-900">Catálogo de categorías y servicios</h1>
          <p className="mt-1 text-blue-700">Visualiza las categorías y servicios asociados a tu perfil.</p>
        </div>
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

