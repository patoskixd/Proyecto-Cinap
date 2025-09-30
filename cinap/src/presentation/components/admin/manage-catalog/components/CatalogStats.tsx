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
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((s, i) => (
        <div key={i} className="bg-white rounded-2xl shadow-lg border p-6 transition-all duration-200 hover:shadow-xl">
          <div className="text-3xl font-bold text-blue-600 mb-2">{s.value}</div>
          <div className="text-sm font-medium text-gray-600">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
