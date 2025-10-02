import React from "react";
import Link from "next/link";
import type { Appointment } from "@/domain/appointment";

type Props = {
  appointments: Appointment[];
};

export default function UpcomingAppointments({ appointments }: Props) {
  const getStatusIcon = (status: string) => {
    if (status === "confirmada") {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  };

  const getStatusStyle = (status: string) => {
    if (status === "confirmada") {
      return "bg-emerald-50 text-emerald-600 border-emerald-200";
    }
    return "bg-amber-50 text-amber-600 border-amber-200";
  };

  if (appointments.length === 0) {
    return (
      <div className="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-blue-100">
        <div className="flex items-center justify-between border-b border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4">
          <h2 className="text-xl font-semibold text-blue-900">Próximas Asesorías</h2>
          <span className="rounded-full bg-gradient-to-br from-blue-600 to-blue-700 px-2.5 py-0.5 text-sm font-semibold text-white shadow-sm">
            0
          </span>
        </div>
        <div className="px-6 py-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-blue-900 mb-2">No hay asesorías próximas</h3>
          <p className="text-sm text-blue-700">Las próximas asesorías programadas aparecerán aquí.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-blue-100">
      <div className="flex items-center justify-between border-b border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4">
        <h2 className="text-xl font-semibold text-blue-900">Próximas Asesorías</h2>
        <span className="rounded-full bg-gradient-to-br from-blue-600 to-blue-700 px-2.5 py-0.5 text-sm font-semibold text-white shadow-sm">
          {appointments.length}
        </span>
      </div>

      <div className="space-y-3 px-6 py-5">
        {appointments.map((appointment) => (
          <div
            key={appointment.id}
            className="flex items-center gap-4 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-white p-4 transition hover:border-blue-400 hover:shadow-md hover:-translate-y-0.5"
          >
            {/* Hora */}
            <div className="flex flex-col items-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 px-3 py-2 text-white shadow-sm">
              <span className="text-lg font-bold">{appointment.time}</span>
              <span className="text-xs font-medium opacity-90">{appointment.dateLabel}</span>
            </div>

            {/* Detalles de la asesoría */}
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-blue-900">{appointment.title}</h4>
              <p className="text-sm text-blue-700">Estudiante: {appointment.student}</p>
              {appointment.location && (
                <div className="flex items-center gap-1 mt-1">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-xs text-blue-600 font-medium">{appointment.location}</span>
                </div>
              )}
            </div>

            {/* Estado */}
            <div className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold shadow-sm ${getStatusStyle(appointment.status)}`}>
              {getStatusIcon(appointment.status)}
              <span className="capitalize">{appointment.status}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Enlace para ver todas */}
      <div className="border-t border-blue-100 bg-gradient-to-r from-blue-50/50 to-white px-6 py-3">
        <Link 
          href="/asesorias/"
          className="block w-full text-center text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
        >
          Ver todas las asesorías →
        </Link>
      </div>
    </div>
  );
}