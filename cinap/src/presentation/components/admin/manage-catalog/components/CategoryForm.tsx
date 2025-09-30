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
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ name, description }); }} className="space-y-6">
      <FormField label="Nombre de la categoría">
        <input required value={name} onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border-2 border-blue-200 bg-white/90 px-4 py-3 text-gray-900 placeholder-gray-500 outline-none transition-all duration-300 focus:border-yellow-500 focus:ring-4 focus:ring-yellow-100 focus:bg-white" 
          placeholder="Ingresa el nombre de la categoría" />
      </FormField>
      <FormField label="Descripción">
        <textarea required rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-xl border-2 border-blue-200 bg-white/90 px-4 py-3 text-gray-900 placeholder-gray-500 outline-none transition-all duration-300 focus:border-yellow-500 focus:ring-4 focus:ring-yellow-100 focus:bg-white resize-none" 
          placeholder="Describe la categoría y su propósito" />
      </FormField>
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button type="button" onClick={onCancel}
          className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all duration-200">
          Cancelar
        </button>
        <button type="submit"
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-yellow-500 hover:from-blue-700 hover:to-yellow-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
          {defaultValues ? "Guardar Cambios" : "Crear Categoría"}
        </button>
      </div>
    </form>
  );
}

function FormField({ label, children }:{ label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-gray-700 mb-2">{label}</span>
      {children}
    </label>
  );
}
