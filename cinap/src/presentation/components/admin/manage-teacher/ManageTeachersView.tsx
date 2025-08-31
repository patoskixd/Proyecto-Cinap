"use client";

import { useEffect, useMemo, useState } from "react";
import type { Teacher } from "@domain/teachers";
import { InMemoryTeachersRepo } from "@infrastructure/teachers/InMemoryTeachersRepo";
import { ListTeachers } from "@application/teachers/usecases/ListTeachers";
import { UpdateTeacher } from "@application/teachers/usecases/UpdateTeacher";
import { DeleteTeacher } from "@application/teachers/usecases/DeleteTeacher";

import TeacherCard from "./TeacherCard";
import EditTeacherModal from "./EditTeacherModal";
import ConfirmDialog from "./ConfirmDialog";

const repo = new InMemoryTeachersRepo();
const ucList = new ListTeachers(repo);
const ucUpdate = new UpdateTeacher(repo);
const ucDelete = new DeleteTeacher(repo);

export default function ManageTeachersView() {
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [editing, setEditing] = useState<Teacher | null>(null);

  // confirm state
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

  // actions
  const requestEdit = (draft: Teacher) => {
    // cerramos modal y abrimos confirmación
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
    <div className="mx-auto mt-6 md:mt-8 max-w-[1100px] space-y-6 px-4 sm:px-6 pb-12">

      {/* Header */}
        <header className="rounded-2xl bg-white px-6 py-6 shadow-[0_10px_30px_rgba(0,0,0,0.08)] ring-1 ring-slate-200">
        <h1 className="text-center text-3xl font-bold text-neutral-900">
            👥 Gestión de Docentes
        </h1>
        <p className="mt-1 text-center text-slate-600">
            Lista de docentes registrados
        </p>

        {/* buscador centrado */}
        <div className="mt-4 flex justify-center">
            <div className="relative w-full max-w-xl">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl">🔍</span>
            <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nombre o correo…"
                className="w-full rounded-full border-2 border-slate-200 bg-white px-12 py-3 text-black outline-none placeholder:text-slate-500 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
            </div>
        </div>
        </header>


      {/* list / empty */}
      {loading ? (
        <div className="grid place-items-center rounded-2xl bg-white p-12 text-slate-500 shadow ring-1 ring-slate-100">
          Cargando…
        </div>
      ) : filtered.length === 0 ? (
        <div className="grid place-items-center rounded-2xl bg-white p-10 text-center shadow ring-1 ring-slate-100">
          <div className="mb-2 text-5xl">📭</div>
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
