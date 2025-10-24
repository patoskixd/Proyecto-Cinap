"use client";

import { useCallback, useEffect, useState } from "react";
import type { Teacher } from "@/domain/admin/teachers";

import { HttpTeachersRepo } from "@/infrastructure/admin/teachers/AdminTeachersHttpRepo";
import { ListTeachers } from "@/application/admin/teachers/usecases/ListTeachers";
import { UpdateTeacher } from "@/application/admin/teachers/usecases/UpdateTeacher";
import { DeleteTeacher } from "@/application/admin/teachers/usecases/DeleteTeacher";
import { notify } from "@/presentation/components/shared/Toast";
import { parseError } from "@/presentation/components/shared/Toast/parseError";

import TeacherCard from "./TeacherCard";
import EditTeacherModal from "./EditTeacherModal";
import ConfirmDialog from "./ConfirmDialog";

const repo = new HttpTeachersRepo();
const ucList = new ListTeachers(repo);
const ucUpdate = new UpdateTeacher(repo);
const ucDelete = new DeleteTeacher(repo);
const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 350;

export default function ManageTeachersView() {
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [editing, setEditing] = useState<Teacher | null>(null);

  const [confirm, setConfirm] = useState<
    | { kind: "edit"; draft: Teacher }
    | { kind: "delete"; id: string; teacher?: Teacher }
    | null
  >(null);

  const [searchValue, setSearchValue] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [reloadToken, setReloadToken] = useState(0);

  const loadPage = useCallback(
    async (pageValue: number, searchValue: string) => {
      setLoading(true);
      try {
        const data = await ucList.exec({
          page: pageValue,
          limit: PAGE_SIZE,
          query: searchValue.trim() || undefined,
        });
        setTeachers(data.items);
        setPage(data.page);
        setPages(data.pages);
        setTotal(data.total);
      } catch (error) {
        console.error("Error loading teachers:", error);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedQuery(searchValue);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [searchValue]);

  useEffect(() => {
    loadPage(page, debouncedQuery);
  }, [page, debouncedQuery, reloadToken, loadPage]);


  const requestEdit = (draft: Teacher) => {
    setEditing(null);
    setConfirm({ kind: "edit", draft });
  };

  const confirmEdit = async () => {
    if (confirm?.kind !== "edit") return;
    const draft = confirm.draft;
    await ucUpdate.exec(draft);
    setReloadToken((r) => r + 1);
    setConfirm(null);
  };

  const requestDelete = (id: string) => {
    const teacher = teachers.find((t) => t.id === id);
    setConfirm({ kind: "delete", id, teacher });
  };

  const confirmDelete = async () => {
    if (confirm?.kind !== "delete") return;
    const teacherName = confirm.teacher?.name?.trim();
    try {
      await ucDelete.exec(confirm.id);
      const targetPage = teachers.length === 1 && page > 1 ? page - 1 : page;
      if (targetPage !== page) {
        setPage(targetPage);
      } else {
        setReloadToken((r) => r + 1);
      }
      notify(
        teacherName
          ? `Se eliminó al docente ${teacherName} correctamente.`
          : "Se eliminó al docente correctamente.",
        "success",
      );
    } catch (error) {
      notify(parseError(error), "error");
    }
    setConfirm(null);
  };

  const hasPrev = page > 1;
  const hasNext = page < pages;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6 rounded-3xl border border-blue-200/50 bg-gradient-to-br from-white via-blue-50/40 to-yellow-50/30 p-6 shadow-xl backdrop-blur-md md:mb-8 md:p-8">
        <div className="mb-6 flex flex-col gap-3 text-center md:flex-row md:items-center md:justify-between">
          <div className="text-left md:text-left">
            <h1 className="text-3xl font-bold text-blue-900">Gestión de Docentes</h1>
            <p className="mt-1 text-blue-700">Administra y organiza tu equipo docente</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/85 px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm ring-1 ring-blue-200/60">
            <span className="h-2 w-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 shadow" />
            <span>{total} Docentes Totales</span>
          </div>
        </div>

        {/* Buscador */}
        <div className="grid gap-4 md:grid-cols-[1.4fr]">
          <div className="flex flex-col gap-1">
            <label className="pl-2 text-xs font-semibold uppercase tracking-wide text-blue-800/80">Buscar</label>
            <div className="group relative w-full">
              <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-blue-500/70">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <input
                value={searchValue}
                onChange={(e) => {
                  setPage(1);
                  setSearchValue(e.target.value);
                }}
                placeholder="Buscar por nombre o correo..."
                className="w-full rounded-2xl border border-blue-100/70 bg-white/90 pl-12 pr-4 py-3 text-sm font-medium text-blue-900 placeholder-blue-400 outline-none transition-all duration-300 shadow-sm focus:border-blue-400 focus:ring-4 focus:ring-blue-100/80"
              />
            </div>
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
      ) : teachers.length === 0 ? (
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
          {teachers.map((t) => (
            <TeacherCard
              key={t.id}
              teacher={t}
              onEdit={(tt) => setEditing(tt)}
              onDelete={requestDelete}
            />
          ))}
        </section>
      )}

      {!loading && pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-blue-900">
                Página <span className="font-semibold">{page}</span> de <span className="font-semibold">{pages}</span> · Total:{" "}
                <span className="font-semibold">{total}</span>
              </div>
              <div className="inline-flex overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm text-black">
                <button
                  onClick={() => hasPrev && setPage((p) => Math.max(1, p - 1))}
                  disabled={!hasPrev}
                  className="px-4 py-2 text-sm font-semibold text-black hover:bg-slate-50 disabled:opacity-50 disabled:text-black/40"
                  >
                  ← Anterior
                </button>
                <div className="px-4 py-2 text-sm font-semibold bg-slate-50 border-x border-slate-200">{page}</div>
                <button
                  onClick={() => hasNext && setPage((p) => Math.min(pages, p + 1))}
                  disabled={!hasNext}
                  className="px-4 py-2 text-sm font-semibold text-black hover:bg-slate-50 disabled:opacity-50 disabled:text-black/40"
                >
                  Siguiente →
                </button>
              </div>
        </div>
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
