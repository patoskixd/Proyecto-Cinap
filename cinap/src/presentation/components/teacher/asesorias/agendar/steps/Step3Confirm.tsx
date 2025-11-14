"use client";

import type { Advisor, Category, Service,  WizardState } from "../types";
import type { FoundSlot } from "@/domain/teacher/scheduling";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between py-3">
      <dt className="text-sm font-medium text-blue-700">{label}</dt>
      <dd className="text-sm font-semibold text-blue-900">{value}</dd>
    </div>
  );
}

export function Step3Confirm({
  categories,
  services,
  advisors,
  state,
  openSlots,
  defaultTimezone,
}: {
  categories: Category[];
  services: Service[];
  advisors: Advisor[];
  state: WizardState;
  openSlots: FoundSlot[];
  defaultTimezone: string;
}) {
  const categoryName = categories.find((c) => c.id === state.categoryId)?.name ?? "-";
  const service = services.find((s) => s.id === state.serviceId);
  const advisor = advisors.find((a) => a.id === state.advisorId);

  const slotData = openSlots.find((s) => s.cupoId === state.slot?.cupoId);
  const dayName = slotData
    ? new Date(`${slotData.date}T${slotData.time}`).toLocaleDateString("es-ES", { weekday: "long" })
    : "-";
  const formattedDay = dayName && dayName !== "-" ? dayName.charAt(0).toUpperCase() + dayName.slice(1) : null;
  const timezoneLabel = defaultTimezone ? ` (${defaultTimezone})` : "";
  const start = slotData?.time ?? "-";
  let end = "-";
  if (slotData) {
    const ini = new Date(`${slotData.date}T${slotData.time}`);
    const fin = new Date(ini.getTime() + (slotData.duration || 0) * 60000);
    end = fin.toTimeString().slice(0, 5);
  }

  const campus = slotData?.campus || "-";
  const building = slotData?.building || "-";
  const roomName = slotData?.resourceAlias || "-";
  const roomNumber = slotData?.roomNumber || "-";
  const slotAdvisorNote = slotData?.notas ?? "-";

  return (
    <div className="space-y-6 p-6 md:p-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-blue-900">Confirma tu asesoría</h2>
        <p className="text-blue-700">Revisa los detalles antes de confirmar tu cita</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="w-full max-w-xl mx-auto lg:col-span-2 rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-6 shadow-md">
          <h3 className="mb-4 border-b-2 border-blue-200 pb-2 text-lg font-semibold text-blue-900">
            Resumen de tu asesoría
          </h3>

          <dl className="divide-y divide-blue-200">
            <Row label="Categoría" value={categoryName} />
            <Row label="Servicio" value={service?.name ?? "-"} />
            <Row label="Duración" value={service?.duration ?? "-"} />
            <Row label="Asesor" value={advisor ? `${advisor.name} ` : "-"} />
            <Row
              label="Fecha y hora"
              value={
                slotData
                  ? `${slotData.date}${formattedDay ? ` (${formattedDay})` : ""} · ${start} - ${end}${timezoneLabel}`
                  : "-"
              }
            />
            <Row label="Campus" value={campus} />
            <Row label="Edificio" value={building} />
            <Row label="Sala" value={`${roomName}${roomNumber !== "-" ? ` ${roomNumber}` : ""}`} />
            <Row label="Nota del asesor" value={slotAdvisorNote} />
          </dl>
        </div>
      </div>
    </div>
  );
}
