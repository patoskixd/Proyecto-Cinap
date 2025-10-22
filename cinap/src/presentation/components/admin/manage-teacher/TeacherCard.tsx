"use client";

import type { Teacher } from "@/domain/admin/teachers";

type Props = {
  teacher: Teacher;
  onEdit: (t: Teacher) => void;
  onDelete: (id: string) => void;
};

export default function TeacherCard({ teacher, onEdit, onDelete }: Props) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-blue-200/40 bg-gradient-to-br from-white via-blue-50/30 to-yellow-50/20 shadow-lg backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:scale-105 hover:shadow-2xl hover:border-blue-300/60">
      {/* Decorative corner gradient */}
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-blue-400/20 to-yellow-400/20 blur-xl transition-all duration-500 group-hover:scale-150 group-hover:bg-gradient-to-br group-hover:from-blue-500/30 group-hover:to-yellow-500/30" />
      
      {/* Status indicator */}
      <div className="absolute right-4 top-4 h-3 w-3 rounded-full bg-gradient-to-r from-green-400 to-green-500 shadow-lg animate-pulse" />

      {/* Main content */}
      <div className="relative p-6">
        {/* Avatar section */}
        <div className="mb-6 flex items-start gap-4">
          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-yellow-500 text-xl font-bold text-white shadow-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
              {initials(teacher.name)}
            </div>
            {/* Badge */}
            <div className="absolute -bottom-1 -right-1 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 p-1.5 shadow-lg">
              <svg className="h-3 w-3 text-blue-700" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-blue-900 transition-colors group-hover:text-blue-700">{teacher.name}</h3>
            <p className="mt-1 text-sm text-blue-700/80 font-medium truncate">{teacher.email}</p>
            
            {/* Role badge */}
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-100 to-yellow-100 px-3 py-1 text-xs font-semibold text-blue-800 border border-blue-200/50">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
              </svg>
              Docente
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onEdit(teacher)}
            className="group/btn relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 px-4 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-700 via-blue-800 to-blue-900 opacity-0 transition-opacity duration-300 group-hover/btn:opacity-100" />
            <div className="relative flex items-center justify-center gap-2">
              <svg className="h-4 w-4 transition-transform duration-300 group-hover/btn:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span className="text-sm">Editar</span>
            </div>
          </button>
          
          <button
            onClick={() => onDelete(teacher.id)}
            className="group/btn relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-500 via-red-600 to-red-700 px-4 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-red-300"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-red-700 to-red-800 opacity-0 transition-opacity duration-300 group-hover/btn:opacity-100" />
            <div className="relative flex items-center justify-center gap-2">
              <svg className="h-4 w-4 transition-transform duration-300 group-hover/btn:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span className="text-sm">Eliminar</span>
            </div>
          </button>
        </div>
      </div>
      
      {/* Shine effect */}
      <div className="absolute inset-0 -translate-x-full transform bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
    </div>
  );
}

function initials(name: string) {
  const i = name
    .trim()
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
  return i || "US";
}
