import React from "react";

export default function Stats({
  totalCampus, totalBuildings, totalRooms, totalCapacity,
}:{
  totalCampus: number;
  totalBuildings: number;
  totalRooms: number;
  totalCapacity: number;
}) {
  const items = [
    { label: "Campus totales", value: totalCampus, icon: "🏛️" },
    { label: "Edificios totales", value: totalBuildings, icon: "🏢" },
    { label: "Salas totales", value: totalRooms, icon: "🚪" },
    { label: "Capacidad total", value: totalCapacity, icon: "👥" },
  ];
  return (
    <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((s, i) => (
        <div key={i} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-2xl">{s.icon}</div>
          <div>
            <div className="text-xl font-bold text-blue-600">{s.value}</div>
            <div className="text-sm font-medium text-neutral-600">{s.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
