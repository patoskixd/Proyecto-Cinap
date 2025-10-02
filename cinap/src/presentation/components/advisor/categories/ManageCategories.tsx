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
      <div className="py-6">
        {/* Header loading actualizado */}
        <div className="mb-6">
          <section className="rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-yellow-500 p-6 md:p-8 shadow-[0_10px_30px_rgba(37,99,235,0.15)] animate-pulse">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex-1">
                <div className="h-8 bg-white/20 rounded-lg w-96 mb-2"></div>
                <div className="h-4 bg-blue-100/40 rounded w-80"></div>
              </div>
            </div>
          </section>
        </div>

        {/* Loading state para Stats */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl shadow-lg border p-6 transition-all duration-200">
              <div className="text-3xl font-bold text-gray-300 mb-2">--</div>
              <div className="text-sm font-medium text-gray-400">Cargando...</div>
            </div>
          ))}
        </div>

        {/* Loading state para Secciones */}
        <SectionCard
          title="Mis categorías activas"
          subtitle="Servicios en los que actualmente ofreces asesorías"
          className="mt-6"
        >
          <div className="rounded-2xl bg-white p-8 text-center border border-gray-200">
            <div className="flex items-center justify-center gap-3">
              <div className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-blue-700 font-medium">Cargando categorías...</span>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Otras categorías del catálogo"
          subtitle="Consulta servicios disponibles en otras categorías"
          className="mt-8"
        >
          <div className="rounded-2xl bg-white p-8 text-center border border-gray-200">
            <div className="flex items-center justify-center gap-3">
              <div className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-blue-700 font-medium">Cargando categorías...</span>
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
