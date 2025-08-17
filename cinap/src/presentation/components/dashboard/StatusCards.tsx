
import React from "react";
// Seccion de donde se encuentran 3 card de estado del dashboard
// Muestra si el calendario de google esta conectado, cuantas asesorias se han programado en el mes y cuantas estan pendientes
// Se usa en la pagina del dashboard 
export default function StatusCards(props: {
  isCalendarConnected: boolean;
  monthCount: number;
  pendingCount: number;
}) {
  const { isCalendarConnected, monthCount, pendingCount } = props;

  return (

    <div className="mb-6 grid grid-cols-1 gap-4 md:mb-8 md:grid-cols-3">
      {/* card de si esya conectado el google calendar*/}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-1 hover:shadow-md">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-2xl">📅</span>
          {isCalendarConnected ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-600">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              Conectado
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-600">
              <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
              Desconectado
            </div>
          )}
        </div>
        <h3 className="text-lg font-semibold text-neutral-900">Google Calendar</h3>
        <p className="text-sm text-neutral-500">
          {isCalendarConnected ? "Sincronización activa" : "Conecta tu calendario para sincronizar"}
        </p>
      </div>

      {/* Card de las asesorias que lleva en el mes */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-1 hover:shadow-md">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-2xl">📊</span>
          <span className="text-2xl font-extrabold text-blue-600">{monthCount}</span>
        </div>
        <h3 className="text-lg font-semibold text-neutral-900">Este Mes</h3>
        <p className="text-sm text-neutral-500">Asesorías programadas</p>
      </div>

      {/* Card de las reuniones pendientes */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-1 hover:shadow-md">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-2xl">⏰</span>
          <span className="text-2xl font-extrabold text-blue-600">{pendingCount}</span>
        </div>
        <h3 className="text-lg font-semibold text-neutral-900">Pendientes</h3>
        <p className="text-sm text-neutral-500">Por confirmar</p>
      </div>
    </div>
  );
}
