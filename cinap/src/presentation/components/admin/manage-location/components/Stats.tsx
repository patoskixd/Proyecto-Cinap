import React from "react";

export default function Stats({
  totalCampus, totalBuildings, totalRooms, totalCapacity,
}:{
  totalCampus: number;
  totalBuildings: number;
  totalRooms: number;
  totalCapacity: number;   // <- capacidad activa total
}) {
  const items = [
    { label: "Campus totales", value: totalCampus },
    { label: "Edificios totales", value: totalBuildings },
    { label: "Salas totales", value: totalRooms },
    { label: "Capacidad activa total", value: totalCapacity },
  ];

  return (
    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((s, i) => (
        <div key={i} className="rounded-2xl bg-white p-6 shadow-lg border transition-all duration-200 hover:shadow-xl">
          <div className="text-2xl font-bold text-blue-600 mb-2">{s.value}</div>
          <div className="text-sm font-medium text-gray-600">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
