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
      <div className="w-full max-w-lg bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden transform animate-in zoom-in-95 duration-200">
        {/* Header con gradiente */}
        <div className="h-20 bg-gradient-to-r from-blue-600 via-blue-700 to-yellow-500 relative">
          <div className="absolute inset-0 bg-black/10"></div>
          <button
            className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-all duration-200"
            onClick={onCancel}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contenido del modal */}
        <div className="px-8 py-6 -mt-6 relative">
          {/* Ícono del modal */}
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full shadow-xl border-4 border-white flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </div>
          </div>

          <h3 className="text-2xl font-bold text-gray-900 text-center mb-6">Editar Docente</h3>

          <div className="space-y-5">
            <Field label="Nombre completo">
              <input
                className="w-full rounded-xl border-2 border-blue-200 bg-white/90 px-4 py-3 text-gray-900 placeholder-gray-500 outline-none transition-all duration-300 focus:border-yellow-500 focus:ring-4 focus:ring-yellow-100 focus:bg-white"
                placeholder="Ingresa el nombre completo"
                value={form.name}
                onChange={(e) => update({ name: e.target.value })}
              />
            </Field>

            <Field label="Correo electrónico">
              <input
                type="email"
                className="w-full rounded-xl border-2 border-blue-200 bg-white/90 px-4 py-3 text-gray-900 placeholder-gray-500 outline-none transition-all duration-300 focus:border-yellow-500 focus:ring-4 focus:ring-yellow-100 focus:bg-white"
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
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-yellow-500 hover:from-blue-700 hover:to-yellow-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
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
