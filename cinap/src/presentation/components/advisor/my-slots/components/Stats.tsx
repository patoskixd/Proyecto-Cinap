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
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
      {items.map((item, i) => (
        <div key={i} className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">{item.value}</div>
            <div className="text-sm font-medium text-neutral-600">{item.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
