"use client";

import { prettyDateTime, timeAgo } from "../utils/date";
import type { PendingConfirmation } from "@/domain/advisor/confirmations";

export default function PendingCard({ r }: { r: PendingConfirmation }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-br from-white via-blue-50/30 to-yellow-50/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-blue-300">
      {/* Header con gradiente institucional */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-yellow-500 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className={[
                "rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide bg-white/95 backdrop-blur-sm shadow-sm",
                (r as any).category === "matematicas" && "text-rose-700",
                (r as any).category === "fisica" && "text-blue-700", 
                (r as any).category === "quimica" && "text-emerald-700",
                (r as any).category === "programacion" && "text-violet-700",
                // Para "Innovación e Investigación en Docencia" usar colores institucionales
                ((r as any).category === "innovacion" || (r as any).categoryLabel?.toLowerCase().includes("innovación")) && "text-blue-800 bg-gradient-to-r from-blue-100 to-yellow-100",
                !(r as any).category && "text-blue-800"
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {(r as any).categoryLabel ?? (r as any).categoria_nombre ?? "Categoría"}
            </span>
            <span className="text-sm text-white/90 font-medium">{timeAgo(r.createdAtISO)}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-300 rounded-full animate-pulse shadow-sm"></div>
            <span className="rounded-full bg-yellow-400/90 backdrop-blur-sm px-3 py-1.5 text-xs font-bold text-yellow-900 shadow-sm">Pendiente</span>
          </div>
        </div>
      </div>

      <div className="px-6 py-5 bg-white/60 backdrop-blur-sm">
        <h3 className="mb-4 text-lg font-bold text-blue-900">{r.serviceTitle}</h3>

        <div className="grid gap-3 text-sm">
          <div className="flex items-center gap-3 p-2 rounded-lg bg-blue-50/50">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <div>
              <span className="font-bold text-blue-800">Docente:</span>
              <span className="ml-2 text-blue-700 font-medium">{r.teacher}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 p-2 rounded-lg bg-yellow-50/50">
            <svg className="w-5 h-5 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div>
              <span className="font-bold text-yellow-800">Fecha y hora:</span>
              <span className="ml-2 text-yellow-700 font-medium">{prettyDateTime(r.dateISO, r.time)}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 p-2 rounded-lg bg-blue-50/50">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div>
              <span className="font-bold text-blue-800">Ubicación:</span>
              <span className="ml-2 text-blue-700 font-medium">{r.location}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 p-2 rounded-lg bg-yellow-50/50">
            <svg className="w-5 h-5 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <div>
              <span className="font-bold text-yellow-800">Sala:</span>
              <span className="ml-2 text-yellow-700 font-medium">{r.room}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-blue-200 bg-gradient-to-r from-blue-50 via-blue-50/80 to-yellow-50/80 px-6 py-4">
        <div className="flex items-center gap-2 text-sm">
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span className="text-blue-700">
            Confirmación enviada por <span className="font-bold text-blue-800">{r.teacherEmail}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
