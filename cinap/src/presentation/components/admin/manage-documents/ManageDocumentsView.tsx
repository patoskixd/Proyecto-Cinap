"use client";
import React, { useEffect, useState } from "react";

export default function ManageDocumentsView() {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [query, setQuery] = useState("");

  async function fetchDocs() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/documents", { credentials: "include", cache: "no-store" });
      if (!res.ok) throw new Error("Error al cargar documentos");
      setDocs(await res.json());
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
      const res = await fetch("/api/admin/documents/upload", { method: "POST", body: form, credentials: "include" });
      if (!res.ok) throw new Error("Error al subir archivo");
      await fetchDocs();
      setFile(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este documento del índice semántico?")) return;
    try {
      await fetch(`/api/admin/documents/${id}`, { method: "DELETE", credentials: "include" });
      await fetchDocs();
    } catch (err) {
      console.error(err);
    }
  }

  const filtered = docs.filter((d) =>
    d.name?.toLowerCase().includes(query.toLowerCase())
  );

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

      {/* BUSCADOR */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar documento..."
          className="w-72 pl-10 pr-4 py-2.5 rounded-xl bg-white border border-blue-200 text-sm text-gray-900 placeholder-gray-500 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all"
        />
        <p className="text-sm text-blue-700">
          Total: <span className="font-semibold">{docs.length}</span>
        </p>
      </div>

      {/* TABLA */}
      <section className="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-blue-100">
        {loading ? (
          <div className="p-12 text-center text-blue-700">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No hay documentos registrados.</div>
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
                {filtered.map((doc) => (
                  <tr key={doc.id} className="border-t border-gray-100 hover:bg-blue-50/50 transition-colors">
                    <td className="px-4 py-4 font-medium text-gray-900">{doc.name}</td>
                    <td className="px-4 py-4 text-gray-600">{doc.kind ?? "doc.chunk"}</td>
                    <td className="px-4 py-4 text-gray-600">{doc.chunks ?? 0}</td>
                    <td className="px-4 py-4 text-gray-600">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => handleDelete(doc.id)}
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
    </main>
  );
}
