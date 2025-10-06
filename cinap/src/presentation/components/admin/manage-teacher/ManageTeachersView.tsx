"use client";

import { useEffect, useMemo, useState } from "react";
import type { Teacher } from "@/domain/admin/teachers";

import { HttpTeachersRepo } from "@/infrastructure/admin/teachers/AdminTeachersHttpRepo";
import { ListTeachers } from "@/application/admin/teachers/usecases/ListTeachers";
import { UpdateTeacher } from "@/application/admin/teachers/usecases/UpdateTeacher";
import { DeleteTeacher } from "@/application/admin/teachers/usecases/DeleteTeacher";

import TeacherCard from "./TeacherCard";
import EditTeacherModal from "./EditTeacherModal";
import ConfirmDialog from "./ConfirmDialog";

const repo = new HttpTeachersRepo();
const ucList = new ListTeachers(repo);
const ucUpdate = new UpdateTeacher(repo);
const ucDelete = new DeleteTeacher(repo);

export default function ManageTeachersView() {
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [editing, setEditing] = useState<Teacher | null>(null);

  const [confirm, setConfirm] = useState<
    | { kind: "edit"; draft: Teacher }
    | { kind: "delete"; id: string; teacher?: Teacher }
    | null
  >(null);

  const [query, setQuery] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await ucList.exec();
        setTeachers(data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return teachers;
    return teachers.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q),
    );
  }, [teachers, query]);


  const requestEdit = (draft: Teacher) => {
    setEditing(null);
    setConfirm({ kind: "edit", draft });
  };

  const confirmEdit = async () => {
    if (confirm?.kind !== "edit") return;
    const draft = confirm.draft;
    await ucUpdate.exec(draft);
    setTeachers((prev) => prev.map((t) => (t.id === draft.id ? draft : t)));
    setConfirm(null);
  };

  const requestDelete = (id: string) => {
    const teacher = teachers.find((t) => t.id === id);
    setConfirm({ kind: "delete", id, teacher });
  };

  const confirmDelete = async () => {
    if (confirm?.kind !== "delete") return;
    await ucDelete.exec(confirm.id);
    setTeachers((prev) => prev.filter((t) => t.id !== confirm.id));
    setConfirm(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6 rounded-2xl border border-blue-200 bg-gradient-to-br from-white via-blue-50/30 to-yellow-50/20 p-6 shadow-lg backdrop-blur-sm md:mb-8 md:p-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-blue-900">
            Gestión de Docentes
          </h1>
          <p className="mt-1 text-blue-700">
            Administra y organiza tu equipo docente
          </p>
        </div>

        {/* Buscador */}
        <div className="flex justify-center">
          <div className="relative w-full max-w-xl">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre o correo..."
              className="w-full rounded-2xl border-2 border-blue-200 bg-white/90 pl-12 pr-4 py-3 text-gray-900 placeholder-gray-500 outline-none transition-all duration-300 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 focus:bg-white shadow-sm"
            />
          </div>
        </div>
      </div>


      {/* list / empty */}
      {loading ? (
        <div className="rounded-2xl bg-white p-12 shadow-lg border">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Cargando docentes...</h3>
              <p className="text-gray-600">Obteniendo la información más reciente</p>
            </div>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="grid place-items-center rounded-2xl bg-white p-10 text-center shadow ring-1 ring-slate-100">
          <div className="mb-2 text-5xl">
            <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-4h-2.586a1 1 0 00-.707.293L12 11.586a1 1 0 01-1.414 0L8.293 9.293A1 1 0 007.586 9H5" />
            </svg>
          </div>
          <h3 className="mb-1 text-xl font-bold text-neutral-900">No se encontraron docentes</h3>
          <p className="text-slate-600">Ajusta tu búsqueda.</p>
        </div>
      ) : (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filtered.map((t) => (
            <TeacherCard
              key={t.id}
              teacher={t}
              onEdit={(tt) => setEditing(tt)}
              onDelete={requestDelete}
            />
          ))}
        </section>
      )}

      {/* modal editar */}
      <EditTeacherModal
        open={!!editing}
        teacher={editing}
        onCancel={() => setEditing(null)}
        onSubmitRequest={requestEdit}
      />

      {/* confirmaciones */}
      <ConfirmDialog
        open={!!confirm && confirm.kind === "edit"}
        title="Confirmar edición"
        message={`¿Deseas guardar los cambios de “${(confirm as any)?.draft?.name}”?`}
        confirmLabel="Guardar"
        onConfirm={confirmEdit}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={!!confirm && confirm.kind === "delete"}
        title="Confirmar eliminación"
        message={`Esta acción no se puede deshacer. ¿Eliminar a “${(confirm as any)?.teacher?.name}”?`}
        confirmLabel="Eliminar"
        onConfirm={confirmDelete}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
