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
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Nombre del servicio">
        <input required value={name} onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border-2 border-slate-200 px-4 py-2 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10" />
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
          className="w-full rounded-xl border-2 border-slate-200 px-4 py-2 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
        />
      </FormField>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel}
          className="rounded-full border-2 border-slate-200 px-4 py-2 font-semibold text-slate-600 transition hover:border-blue-600 hover:text-blue-600">
          Cancelar
        </button>
        <button type="submit"
          className="rounded-full bg-gradient-to-br from-blue-600 to-blue-700 px-4 py-2 font-semibold text-white shadow-[0_4px_15px_rgba(37,99,235,0.3)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(37,99,235,0.4)]">
          Guardar
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
