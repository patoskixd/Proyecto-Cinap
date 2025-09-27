import React, { useState } from "react";

export default function CategoryForm({
  label, defaultValues, onSubmit, onCancel,
}:{
  label?: string;
  defaultValues?: Partial<{ name: string; description: string }>;
  onSubmit: (payload:{ name: string; description: string }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(defaultValues?.name ?? "");
  const [description, setDescription] = useState(defaultValues?.description ?? "");
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ name, description }); }} className="space-y-4">
      <FormField label="Nombre de la categoría">
        <input required value={name} onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border-2 border-slate-200 px-4 py-2 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10" />
      </FormField>
      <FormField label="Descripción">
        <textarea required rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-xl border-2 border-slate-200 px-4 py-2 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10" />
      </FormField>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel}
          className="rounded-full border-2 border-slate-200 px-4 py-2 font-semibold text-slate-600 transition hover:border-blue-600 hover:text-blue-600">
          Cancelar
        </button>
        <button type="submit"
          className="rounded-full bg-gradient-to-br from-blue-600 to-blue-700 px-4 py-2 font-semibold text-white shadow-[0_4px_15px_rgba(37,99,235,0.3)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(37,99,235,0.4)]">
          {defaultValues ? "Guardar Cambios" : "Crear Categoría"}
        </button>
      </div>
    </form>
  );
}

function FormField({ label, children }:{ label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      <span className="mb-1 block">{label}</span>
      {children}
    </label>
  );
}
