"use client";
import React, { useEffect, useMemo, useState } from "react";
import type { AdminDocument } from "@/domain/admin/documents";
import { AdminDocumentsHttpRepo } from "@/infrastructure/admin/documents/AdminDocumentsHttpRepo";
import { ListDocuments } from "@/application/admin/documents/usecases/ListDocuments";
import { UploadDocument } from "@/application/admin/documents/usecases/UploadDocument";
import { DeleteDocument } from "@/application/admin/documents/usecases/DeleteDocument";
import ConfirmModal from "./components/ConfirmModal";

const repo = new AdminDocumentsHttpRepo();
const listUseCase = new ListDocuments(repo);
const uploadUseCase = new UploadDocument(repo);
const deleteUseCase = new DeleteDocument(repo);

const PAGE_SIZE = 10;

export default function ManageDocumentsView() {
  const [docs, setDocs] = useState<AdminDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [query, setQuery] = useState("");
  const [docToDelete, setDocToDelete] = useState<AdminDocument | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"recent" | "name">("recent");
  const [page, setPage] = useState(1);

  async function fetchDocs() {
    setLoading(true);
    try {
      const items = await listUseCase.execute();
      setDocs(items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDocs();
  }, []);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    setLoading(true);
    try {
      await uploadUseCase.execute(form);
      await fetchDocs();
      setFile(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmDelete() {
    if (!docToDelete || deletingId) return;
    setDeletingId(docToDelete.id);
    try {
      await deleteUseCase.execute(docToDelete.id);
      setDocToDelete(null);
      await fetchDocs();
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  }

  const filteredDocs = useMemo(() => {
    const lowered = query.trim().toLowerCase();
    return docs.filter((d) =>
      lowered ? d.name?.toLowerCase().includes(lowered) : true
    );
  }, [docs, query]);

  const orderedDocs = useMemo(() => {
    const list = [...filteredDocs];
    switch (sortBy) {
      case "name":
        return list.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
      default: {
        return list.sort((a, b) => {
          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bTime - aTime;
        });
      }
    }
  }, [filteredDocs, sortBy]);

  const hasActiveFilters = query.trim().length > 0;
  const totalPages = Math.max(1, Math.ceil(orderedDocs.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [query, sortBy, docs.length]);

  useEffect(() => {
    setPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  const paginatedDocs = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return orderedDocs.slice(start, start + PAGE_SIZE);
  }, [orderedDocs, page]);
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <main className="mx-auto mt-6 max-w-[1200px] px-6 pb-24">
      {/* HEADER */}
      <div className="mb-6 rounded-2xl border border-blue-200 bg-gradient-to-br from-white via-blue-50/30 to-yellow-50/20 p-6 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-blue-900">Gestión de Documentos</h1>
            <p className="text-blue-700">Administra los archivos usados en la búsqueda semántica.</p>
          </div>
          <form onSubmit={handleUpload} className="flex flex-col md:flex-row items-center gap-3">
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              accept=".pdf,.txt,.docx,.md"
              className="w-full md:w-auto border border-blue-200 rounded-xl px-4 py-2 text-sm text-blue-900"
            />
            <button
              type="submit"
              disabled={!file || loading}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-2 text-white font-semibold hover:scale-105 transition"
            >
              Subir Documento
            </button>
          </form>
        </div>
      </div>

      {/* FILTROS */}
      <section className="mb-6 rounded-2xl border border-blue-100/70 bg-white/80 p-6 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-blue-900">
            <span className="text-2xl font-semibold text-blue-700 mr-1">{orderedDocs.length}</span>
            visibles{" "}
            <span className="text-gray-500">
              / {docs.length} totales
            </span>
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
              }}
              className="text-sm font-medium text-blue-700 hover:text-blue-900 hover:underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-blue-500">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1010.5 18a7.5 7.5 0 006.15-3.35z" />
              </svg>
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre..."
              className="w-full rounded-2xl border border-blue-200 bg-white/80 py-3 pl-12 pr-4 text-sm text-gray-900 shadow-inner outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-200/50"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-600">Ordenar por</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="rounded-2xl border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-200/70"
            >
              <option value="recent">Mas recientes</option>
              <option value="name">Nombre A-Z</option>
            </select>
          </div>
        </div>
      </section>

      {/* TABLA */}
      <section className="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-blue-100">
        {loading ? (
          <div className="p-12 text-center text-blue-700">Cargando...</div>
        ) : orderedDocs.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            {docs.length === 0 ? "No hay documentos registrados." : "No se encontraron documentos con los filtros seleccionados."}
          </div>
        ) : (
          <div className="overflow-x-auto p-6">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 text-left text-sm">
                  <th className="px-4 py-3 font-medium text-gray-700">Nombre</th>
                  <th className="px-4 py-3 font-medium text-gray-700">Tipo</th>
                  <th className="px-4 py-3 font-medium text-gray-700">Chunks</th>
                  <th className="px-4 py-3 font-medium text-gray-700">Fecha</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDocs.map((doc) => (
                  <tr key={doc.id} className="border-t border-gray-100 hover:bg-blue-50/50 transition-colors">
                    <td className="px-4 py-4 font-medium text-gray-900">{doc.name}</td>
                    <td className="px-4 py-4 text-gray-600">{doc.kind ?? "doc.chunk"}</td>
                    <td className="px-4 py-4 text-gray-600">{doc.chunks ?? 0}</td>
                    <td className="px-4 py-4 text-gray-600">
                      {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => setDocToDelete(doc)}
                        className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium
                                   bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100
                                   shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-rose-500/50"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span className="hidden sm:inline">Eliminar</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {!loading && orderedDocs.length > 0 && totalPages > 1 && (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-blue-100 bg-white/80 px-6 py-4 text-sm text-blue-900 shadow-sm">
          <div>
            Página <span className="font-semibold">{page}</span> de{" "}
            <span className="font-semibold">{totalPages}</span> · Total:{" "}
            <span className="font-semibold">{orderedDocs.length}</span> documentos
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => hasPrev && setPage((prev) => Math.max(1, prev - 1))}
              disabled={!hasPrev}
              className="rounded-l-2xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 transition disabled:cursor-not-allowed disabled:opacity-40 hover:bg-blue-50"
            >
              ←
            </button>
            <div className="border-y border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-900">
              {page}
            </div>
            <button
              type="button"
              onClick={() => hasNext && setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={!hasNext}
              className="rounded-r-2xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 transition disabled:cursor-not-allowed disabled:opacity-40 hover:bg-blue-50"
            >
              →
            </button>
          </div>
        </div>
      )}
      {docToDelete && (
        <ConfirmModal
          title="Eliminar documento"
          message="Esta accion quitara el archivo del indice semantico. Deseas continuar?"
          body={
            <>
              <div>
                <span className="font-semibold">Archivo:</span> {docToDelete.name}
              </div>
              <div>
                <span className="font-semibold">Tipo:</span> {docToDelete.kind ?? "doc.chunk"}
              </div>
              <div>
                <span className="font-semibold">Chunks:</span> {docToDelete.chunks ?? 0}
              </div>
            </>
          }
          confirmLabel={deletingId === docToDelete.id ? "Eliminando..." : undefined}
          onCancel={() => {
            if (deletingId) return;
            setDocToDelete(null);
          }}
          onConfirm={handleConfirmDelete}
        />
      )}
    </main>
  );
}
