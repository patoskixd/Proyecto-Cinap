"use client";

type Props = {
  total: number;
  disponibles: number;
  ocupadasHM: string;
};

export default function Stats({ total, disponibles, ocupadasHM }: Props) {
  const items = [
    { label: "Cupos totales", value: total },
    { label: "Disponibles", value: disponibles },
    { label: "Horas ocupadas", value: ocupadasHM },
  ];
  return (
    <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
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
