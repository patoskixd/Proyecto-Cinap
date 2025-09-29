import React, { useState } from "react";

export default function ServiceForm({
  defaultValues, onSubmit, onCancel,
}:{
  defaultValues?: Partial<{ name: string; durationMinutes: number }>;
  onSubmit: (payload:{ name: string; durationMinutes: number }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(defaultValues?.name ?? "");
  // Evita el "0" cuando el usuario borra: mantenemos string
  const [durationStr, setDurationStr] = useState<string>(
    defaultValues?.durationMinutes != null ? String(defaultValues.durationMinutes) : "30"
  );

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (v === "") { setDurationStr(""); return; }
    const digits = v.replace(/[^\d]/g, "");
    const normalized = digits.replace(/^0+(?=\d)/, "");
    setDurationStr(normalized);
  };

  const handleBlur = () => {
    if (durationStr === "") return;
    const n = parseInt(durationStr, 10);
    if (!Number.isNaN(n)) setDurationStr(String(Math.max(5, n)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseInt(durationStr, 10);
    if (Number.isNaN(n)) return;
    onSubmit({ name, durationMinutes: Math.max(5, n) });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormField label="Nombre del servicio">
        <input required value={name} onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 bg-white/90 backdrop-blur-sm outline-none transition-all duration-200 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 hover:border-gray-400" />
      </FormField>
      <FormField label="Duración (min)">
        <input
          required
          type="number"
          inputMode="numeric"
          min={5}
          step={5}
          placeholder="30"
          value={durationStr}
          onChange={handleDurationChange}
          onBlur={handleBlur}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 bg-white/90 backdrop-blur-sm outline-none transition-all duration-200 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 hover:border-gray-400"
        />
      </FormField>
      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={onCancel}
          className="rounded-xl border border-gray-300 px-6 py-3 font-medium text-gray-700 transition-all duration-200 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700">
          Cancelar
        </button>
        <button type="submit"
          className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 font-medium text-white shadow-lg hover:shadow-blue-200 transition-all duration-200 hover:scale-105">
          Guardar
        </button>
      </div>
    </form>
  );
}

function FormField({ label, children }:{ label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-gray-700">
      <span className="mb-2 block">{label}</span>
      {children}
    </label>
  );
}
