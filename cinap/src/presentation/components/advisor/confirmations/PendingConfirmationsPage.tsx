"use client";

import { useMemo, useState } from "react";
import type { PendingConfirmation, ConfirmationCategory } from "@domain/confirmations";

/* helpers */
const toLocalDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
};
const todayISO = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `Hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Hace ${h} horas`;
  const d = Math.floor(h / 24);
  return `Hace ${d} día${d > 1 ? "s" : ""}`;
};
const prettyDateTime = (dateISO: string, time: string) => {
  const d = toLocalDate(dateISO);
  const s = d
    .toLocaleDateString("es-ES", { weekday: "long", day: "2-digit", month: "short", year: "numeric" })
    .replace(",", "");
  const [hh, mm] = time.split(":");
  const hhNum = Number(hh);
  const isPM = hhNum >= 12;
  const hh12 = ((hhNum + 11) % 12) + 1;
  return `${s} - ${String(hh12).padStart(1, "0")}:${mm} ${isPM ? "PM" : "AM"}`;
};

type Filters = {
  category: "" | ConfirmationCategory;
  date: "" | "today" | "tomorrow" | "week";
  q: string; // docente
};

export default function PendingConfirmationsPage(props: { items: PendingConfirmation[] }) {
  const { items } = props;

  const [filters, setFilters] = useState<Filters>({ category: "", date: "", q: "" });

  const filtered = useMemo(() => {
    const tISO = todayISO();
    const tomorrowISO = (() => {
      const d = new Date(toLocalDate(tISO));
      d.setDate(d.getDate() + 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    })();

    return items.filter((r) => {
      const byCat = !filters.category || r.category === filters.category;
      const byQ = !filters.q || r.teacher.toLowerCase().includes(filters.q.toLowerCase());
      let byDate = true;
      if (filters.date === "today") byDate = r.dateISO === tISO;
      else if (filters.date === "tomorrow") byDate = r.dateISO === tomorrowISO;
      else if (filters.date === "week") {
        const d = toLocalDate(r.dateISO);
        const now = new Date();
        const diff = (d.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) / 86400000;
        byDate = diff >= 0 && diff < 7;
      }
      return byCat && byQ && byDate;
    });
  }, [items, filters]);

  const stats = useMemo(() => {
    const total = items.length;
    const hoy = items.filter((x) => x.dateISO === todayISO()).length;
    return { total, hoy };
  }, [items]);

  return (
    <div className="py-6">
      {/* header */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Solicitudes por Confirmar</h1>
          <p className="text-neutral-600">
            Revisa las solicitudes pendientes que requieren confirmación por correo de Google.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center shadow-sm">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-xs font-medium text-neutral-600">Pendientes</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center shadow-sm">
            <div className="text-2xl font-bold text-blue-600">{stats.hoy}</div>
            <div className="text-xs font-medium text-neutral-600">Hoy</div>
          </div>
        </div>
      </div>

        {/* filtros */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-end">
                <div className="flex min-w-[220px] flex-col">
                    <label className="mb-1 text-sm font-semibold text-neutral-900">Categoría</label>
                    <select
                        className="rounded-lg border-2 border-slate-200 p-2.5 text-sm text-neutral-900 bg-white"
                        value={filters.category}
                        onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value as Filters["category"] }))}
                        >
                        <option value="">Todas las categorías</option>
                        <option value="matematicas">Matemáticas</option>
                        <option value="fisica">Física</option>
                        <option value="quimica">Química</option>
                        <option value="programacion">Programación</option>
                    </select>
                </div>
                <div className="flex min-w-[220px] flex-col">
                    <label className="mb-1 text-sm font-semibold text-neutral-900">Fecha</label>
                    <select
                        className="rounded-lg border-2 border-slate-200 p-2.5 text-sm text-neutral-900 bg-white"
                        value={filters.date}
                        onChange={(e) => setFilters((f) => ({ ...f, date: e.target.value as Filters["date"] }))}
                    >
                        <option value="">Todas las fechas</option>
                        <option value="today">Hoy</option>
                        <option value="tomorrow">Mañana</option>
                        <option value="week">Esta semana</option>
                    </select>
                </div>
                <div className="relative flex-1">
                    <input
                        className="w-full rounded-lg border-2 border-slate-200 p-2.5 pl-9 text-sm text-neutral-900 bg-white placeholder:text-neutral-500"
                        placeholder="Buscar por docente…"
                        value={filters.q}
                        onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
                    />
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">⌕</span>
                </div>
            </div>
        </div>

      {/* listado */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="mb-2 text-4xl text-neutral-400">📭</div>
          <h3 className="mb-1 text-lg font-semibold text-neutral-900">No hay solicitudes pendientes</h3>
          <p className="mx-auto mb-3 max-w-md text-neutral-600">
            Todas las solicitudes han sido confirmadas o no hay nuevas solicitudes en este momento.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((r) => (
            <div key={r.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between px-5 pt-5">
                <div className="flex items-center gap-3">
                  <span
                    className={[
                      "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
                      r.category === "matematicas" && "bg-rose-100 text-rose-700",
                      r.category === "fisica" && "bg-blue-100 text-blue-700",
                      r.category === "quimica" && "bg-emerald-100 text-emerald-700",
                      r.category === "programacion" && "bg-violet-100 text-violet-700",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {r.categoryLabel}
                  </span>
                  <span className="text-sm text-neutral-500">{timeAgo(r.createdAtISO)}</span>
                </div>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                  Pendiente
                </span>
              </div>

              <div className="px-5 py-4">
                <h3 className="mb-2 text-lg font-semibold text-neutral-900">{r.serviceTitle}</h3>

                <div className="grid gap-2 text-sm text-neutral-700">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Docente:</span>
                    <span>{r.teacher}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Fecha y hora:</span>
                    <span>{prettyDateTime(r.dateISO, r.time)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Ubicación:</span>
                    <span>{r.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Sala:</span>
                    <span>{r.room}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 bg-slate-50 px-5 py-3">
                <div className="text-sm italic text-neutral-600">
                  Confirmación enviada por <span className="font-medium not-italic">{r.teacherEmail}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
