"use client";

import { useEffect, useState } from "react";
import type { Teacher } from "@domain/teachers";

type Props = {
  open: boolean;
  teacher: Teacher | null;
  onCancel: () => void;
  // No guardamos directo: devolvemos los datos para que el padre confirme
  onSubmitRequest: (draft: Teacher) => void;
};

export default function EditTeacherModal({ open, teacher, onCancel, onSubmitRequest }: Props) {
  const [form, setForm] = useState<Teacher | null>(teacher);

  useEffect(() => setForm(teacher), [teacher]);

  if (!open || !form) return null;

  const update = (patch: Partial<Teacher>) => setForm((f) => (f ? { ...f, ...patch } : f));

  return (
    <div
      className="fixed inset-0 z-[150] grid place-items-center bg-black/40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-100">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="text-lg font-bold text-neutral-900">Editar docente</h3>
          <button
            className="grid h-8 w-8 place-items-center rounded-full text-2xl text-slate-500 hover:bg-slate-100"
            onClick={onCancel}
          >
            ×
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <Field label="Nombre completo">
            <input
              className="w-full rounded-lg border-2 border-slate-200 px-3 py-2 text-black placeholder:text-slate-400 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              value={form.name}
              onChange={(e) => update({ name: e.target.value })}
            />
          </Field>

          <Field label="Correo electrónico">
            <input
              type="email"
              className="w-full rounded-lg border-2 border-slate-200 px-3 py-2 text-black placeholder:text-slate-400 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              value={form.email}
              onChange={(e) => update({ email: e.target.value })}
            />
          </Field>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
          <button
            onClick={onCancel}
            className="rounded-full bg-slate-100 px-5 py-2 font-semibold text-slate-700 hover:bg-slate-200"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSubmitRequest(form)}
            className="rounded-full bg-gradient-to-br from-blue-600 to-blue-700 px-5 py-2 font-semibold text-white shadow-sm"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  );
}
