import React, { useState } from "react";

type Values = { name: string; description: string };

export default function CategoryModal({
  title,
  defaultValues,
  onClose,
  onSubmit,
  size = "md",
}: {
  title: string;
  defaultValues?: Partial<Values>;
  onClose: () => void;
  onSubmit: (payload: Values) => void | Promise<void>;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const [name, setName] = useState(defaultValues?.name ?? "");
  const [description, setDescription] = useState(defaultValues?.description ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, description });
  };

  const maxWidthClass = 
    size === "sm" ? "max-w-md" :
    size === "md" ? "max-w-xl" :
    size === "lg" ? "max-w-6xl" :
    "max-w-7xl";

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`w-full ${maxWidthClass} bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 overflow-hidden transform animate-in zoom-in-95 duration-200`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
          <div className="flex items-start justify-between px-6 py-5">
            <h3 className="text-xl font-semibold text-blue-900">{title}</h3>
            <button
              className="w-8 h-8 hover:bg-blue-200/50 rounded-full flex items-center justify-center text-blue-700 transition-colors"
              onClick={onClose}
              aria-label="Cerrar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Contenido del modal */}
        <div className="px-6 py-6 relative">
          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block">
              <span className="block text-sm font-semibold text-gray-700 mb-2">Nombre de la categoría</span>
              <input 
                required 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100" 
                placeholder="Ingresa el nombre de la categoría" 
              />
            </label>

            <label className="block">
              <span className="block text-sm font-semibold text-gray-700 mb-2">Descripción</span>
              <textarea 
                required 
                rows={3} 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none" 
                placeholder="Describe la categoría y su propósito" 
              />
            </label>

            <div className="flex items-center justify-end gap-3 mt-8">
              <button 
                type="button" 
                onClick={onClose}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all duration-200"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
              >
                {defaultValues ? "Guardar Cambios" : "Crear Categoría"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
