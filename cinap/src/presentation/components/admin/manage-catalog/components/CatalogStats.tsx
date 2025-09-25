import React from "react";

export default function CatalogStats({
  totalCategorias,
  categoriasActivas,
  serviciosActivos,
  serviciosTotales,
}: {
  totalCategorias: number;
  categoriasActivas: number;
  serviciosActivos: number | string;
  serviciosTotales: number | string;
}) {
  const items = [
    { label: "Categorías totales", value: totalCategorias },
    { label: "Categorías activas", value: categoriasActivas },
    { label: "Servicios activos", value: serviciosActivos },
    { label: "Servicios totales", value: serviciosTotales },
  ];
  return (
    <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((s, i) => (
        <div key={i} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div>
            <div className="text-xl font-bold text-blue-600">{s.value}</div>
            <div className="text-sm font-medium text-neutral-600">{s.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
