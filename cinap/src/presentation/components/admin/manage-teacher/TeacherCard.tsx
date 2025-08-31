"use client";

import type { Teacher } from "@domain/teachers";

type Props = {
  teacher: Teacher;
  onEdit: (t: Teacher) => void;
  onDelete: (id: string) => void;
};

export default function TeacherCard({ teacher, onEdit, onDelete }: Props) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_6px_20px_rgba(0,0,0,0.08)]">
      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-[56px] w-[56px] place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-lg font-bold text-white">
          {initials(teacher.name)}
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold text-neutral-900">{teacher.name}</h3>
          <p className="truncate text-sm text-slate-600">{teacher.email}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onEdit(teacher)}
          className="flex-1 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
        >
          ✏️ Editar
        </button>
        <button
          onClick={() => onDelete(teacher.id)}
          className="flex-1 rounded-full bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
        >
          🗑️ Eliminar
        </button>
      </div>
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
