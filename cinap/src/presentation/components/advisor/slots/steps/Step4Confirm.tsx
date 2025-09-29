"use client";
import type { Category, CategoryId, Service } from "../types";
import type { Resource } from "@domain/slots";
import { formatEsDate } from "../utils/date";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[140px_1fr] items-start gap-4 py-3">
      <dt className="text-sm font-medium text-neutral-700">{label}</dt>
      <dd className="text-sm font-semibold text-neutral-900">{value}</dd>
    </div>
  );
}

type Props = {
  categories: Category[];
  servicesByCategory: Record<CategoryId, Service[]>;
  categoryId?: CategoryId;
  serviceId?: string;
  resource?: Resource;
  schedules: Array<{ day: any; startTime: string; endTime: string; isoDate?: string }>;
  serviceDurationMin: number;
  notes: string;
};

export default function Step4Confirm({
  categories, servicesByCategory, categoryId, serviceId, resource, schedules, serviceDurationMin, notes
}: Props) {
  const services = categoryId ? (servicesByCategory[categoryId] ?? []) : [];
  const selectedService = services.find(s => s.id === serviceId);

  const salaLabel = resource ? `${resource.alias}${resource.number ? ` — ${resource.number}` : ""}` : "-";
  const ubicacion = resource ? `${resource.building} · ${resource.campus}` : "-";

  const toMin = (hhmm: string) => {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
  };
  const slotsFor = (start: string, end: string) =>
    Math.max(0, Math.floor((toMin(end) - toMin(start)) / (serviceDurationMin || 60)));

  const totalSlots = schedules.reduce((acc, s) => acc + slotsFor(s.startTime, s.endTime), 0);

  return (
    <div className="space-y-8 p-6 md:p-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-blue-900">Confirma tus cupos</h2>
        <p className="text-blue-700">Revisa la información antes de crear los cupos</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-6 shadow-md">
          <h3 className="mb-4 border-b-2 border-blue-200 pb-2 text-lg font-semibold text-blue-900">Resumen</h3>
          <dl className="divide-y divide-slate-200">
            <Row label="Categoría" value={categories.find((c) => c.id === categoryId)?.name ?? "-"} />
            <Row label="Servicio" value={selectedService?.name ?? "-"} />
            <Row label="Duración" value={selectedService?.duration ?? "-"} />
            <Row label="Sala" value={salaLabel} />
            <Row label="Ubicación" value={ubicacion} />
            {notes && <Row label="Notas" value={notes} />}
          </dl>
        </div>

        <div className="rounded-2xl border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-white p-6 shadow-md">
          <h3 className="mb-4 border-b-2 border-yellow-200 pb-2 text-lg font-semibold text-yellow-900">Horarios configurados</h3>
          <div className="space-y-2">
            {schedules.map((s, i) => (
              <div key={`${s.isoDate ?? s.day}-${i}`} className="flex items-center justify-between rounded-lg border border-yellow-200 bg-white px-3 py-2 shadow-sm">
                <div>
                  <div className="font-semibold text-yellow-900">
                    {s.isoDate ? formatEsDate(s.isoDate) : s.day}
                  </div>
                  <div className="text-sm text-yellow-700">{s.startTime} - {s.endTime}</div>
                </div>
                <div className="text-sm font-semibold text-blue-700">
                  {slotsFor(s.startTime, s.endTime)} cupos
                </div>
              </div>
            ))}
            <div className="rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 p-3 text-center text-blue-800 border border-blue-200">
              <strong>Total de cupos a crear: {totalSlots}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
