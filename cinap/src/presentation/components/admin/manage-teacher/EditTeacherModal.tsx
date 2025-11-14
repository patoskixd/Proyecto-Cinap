"use client";

import { useEffect, useState } from "react";
import type { Teacher } from "@/domain/admin/teachers";

type Props = {
  open: boolean;
  teacher: Teacher | null;
  onCancel: () => void;

  onSubmitRequest: (draft: Teacher) => void;
};

export default function EditTeacherModal({ open, teacher, onCancel, onSubmitRequest }: Props) {
  const [form, setForm] = useState<Teacher | null>(teacher);

  useEffect(() => setForm(teacher), [teacher]);

  if (!open || !form) return null;

  const update = (patch: Partial<Teacher>) => setForm((f) => (f ? { ...f, ...patch } : f));

  return (
    <div
      className="fixed inset-0 z-[150] grid place-items-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="w-full max-w-lg bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 overflow-hidden transform animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200 py-4 sm:py-5">
          <div className="flex items-center justify-between px-6">
            <div>
              <h3 className="text-lg font-bold text-blue-900 sm:text-xl">Editar Docente</h3>
              <p className="text-xs text-blue-700 sm:text-sm">Modifica la información del docente</p>
            </div>
            <button
              className="hover:bg-blue-200/50 text-blue-700 rounded-full p-2 transition-colors"
              onClick={onCancel}
              aria-label="Cerrar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Contenido del modal */}
        <div className="px-8 py-6 relative">
          <div className="space-y-5">
            <Field label="Nombre completo">
              <input
                className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Ingresa el nombre completo"
                value={form.name}
                onChange={(e) => update({ name: e.target.value })}
              />
            </Field>

            <Field label="Correo electrónico">
              <input
                type="email"
                className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="docente@ejemplo.com"
                value={form.email}
                onChange={(e) => update({ email: e.target.value })}
              />
            </Field>
          </div>

          <div className="flex items-center justify-end gap-3 mt-8">
            <button
              onClick={onCancel}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all duration-200"
            >
              Cancelar
            </button>
            <button
              onClick={() => onSubmitRequest(form)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
            >
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-gray-700 mb-2">{label}</span>
      {children}
    </label>
  );
}
