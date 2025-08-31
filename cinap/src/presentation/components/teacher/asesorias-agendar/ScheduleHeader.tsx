// src/presentation/components/asesoria-agendar/ScheduleHeader.tsx
export default function ScheduleHeader() {
  return (
    <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 md:mb-8 md:p-8">
      <div className="text-center md:text-left">
        <h1 className="text-3xl font-bold text-neutral-900">Nueva Asesoría</h1>
        <p className="mt-1 text-neutral-500">
          Selecciona categoría, servicio, asesor, fecha y confirma tu cita.
        </p>
      </div>
    </div>
  );
}
