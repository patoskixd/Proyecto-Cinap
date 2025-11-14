"use client";

import { useMemo, useState } from "react";
import type { PendingConfirmation } from "@/domain/advisor/confirmations";

import { HeaderCard } from "./components/HeaderCard";
import { StatsCards } from "./components/StatsCard";
import Filters, { type Filters as FiltersT } from "./components/Filters";
import PendingList from "./components/PendingList";

import { startOfDay, todayISO, toLocalDate } from "./utils/date";

export default function PendingConfirmationsPage(props: { items: PendingConfirmation[]; loading?: boolean }) {
  const { items, loading = false } = props;

  const [filters, setFilters] = useState<FiltersT>({ category: "", date: "", q: "" });
  const handleChange = (patch: Partial<FiltersT>) => setFilters((f) => ({ ...f, ...patch }));


  const nowStart = useMemo(() => startOfDay(new Date()), []);
  const weekEnd = useMemo(() => {
    const d = new Date(nowStart);
    d.setDate(d.getDate() + 6);
    return d;
  }, [nowStart]);
  const monthStart = useMemo(() => new Date(nowStart.getFullYear(), nowStart.getMonth(), 1), [nowStart]);
  const monthEnd = useMemo(() => new Date(nowStart.getFullYear(), nowStart.getMonth() + 1, 0), [nowStart]);

  const filtered = useMemo(() => {
    const tISO = todayISO();

    const tomorrowISO = (() => {
      const d = toLocalDate(tISO);
      d.setDate(d.getDate() + 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    })();

    return items.filter((r) => {
      const valueCategory = (r as any).category ?? (r as any).categoria ?? "";
      const byCat = !filters.category || valueCategory === filters.category;
      const byQ = !filters.q || r.teacher.toLowerCase().includes(filters.q.toLowerCase());

      let byDate = true;
      if (filters.date === "today") byDate = r.dateISO === tISO;
      else if (filters.date === "tomorrow") byDate = r.dateISO === tomorrowISO;
      else if (filters.date === "week") {
        const d = toLocalDate(r.dateISO);
        byDate = d >= nowStart && d <= weekEnd;
      } else if (filters.date === "month") {
        const d = toLocalDate(r.dateISO);
        byDate = d >= monthStart && d <= monthEnd;
      }

      return byCat && byQ && byDate;
    });
  }, [items, filters, nowStart, weekEnd, monthStart, monthEnd]);

  const stats = useMemo(() => {
    const tISO = todayISO();
    const total = items.length;
    const today = items.filter((x) => x.dateISO === tISO).length;
    const week = items.filter((x) => {
      const d = toLocalDate(x.dateISO);
      return d >= nowStart && d <= weekEnd;
    }).length;
    const month = items.filter((x) => {
      const d = toLocalDate(x.dateISO);
      return d >= monthStart && d <= monthEnd;
    }).length;
    return { total, today, week, month };
  }, [items, nowStart, weekEnd, monthStart, monthEnd]);

  if (loading) {
    return (
      <div className="space-y-6 py-6">
        {/* Header loading state */}
        <section className="rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-yellow-500 p-6 md:p-8 shadow-[0_10px_30px_rgba(37,99,235,0.15)] animate-pulse">
          <div className="flex flex-col gap-2">
            <div className="h-8 bg-white/20 rounded-lg w-80"></div>
            <div className="h-4 bg-blue-100/40 rounded w-96"></div>
          </div>
        </section>

        {/* Loading state para Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl border border-blue-200 bg-gradient-to-br from-white via-blue-50/30 to-yellow-50/20 p-4 shadow-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-300 mb-1">--</div>
                <div className="text-sm font-medium text-blue-400">Cargando...</div>
              </div>
            </div>
          ))}
        </div>

        {/* Loading state para Filtros */}
        <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-white via-blue-50/30 to-yellow-50/20 p-6 shadow-lg backdrop-blur-sm opacity-60">
          <div className="mb-4">
            <div className="h-5 bg-blue-200 rounded animate-pulse w-40 mb-2"></div>
            <div className="h-4 bg-blue-100 rounded animate-pulse w-80"></div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col space-y-2">
                <div className="h-4 bg-blue-200 rounded animate-pulse w-20"></div>
                <div className="h-10 bg-blue-100/50 rounded-lg animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Loading state para Lista */}
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-2xl border border-blue-200 bg-gradient-to-br from-white via-blue-50/30 to-yellow-50/20 shadow-lg p-6">
              <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-yellow-500 rounded-xl h-16 mb-4 animate-pulse"></div>
              <div className="space-y-3">
                <div className="h-4 bg-blue-200 rounded animate-pulse"></div>
                <div className="h-4 bg-yellow-200 rounded animate-pulse w-3/4"></div>
                <div className="h-4 bg-blue-200 rounded animate-pulse w-1/2"></div>
              </div>
              <div className="mt-4 flex items-center justify-center gap-3">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-blue-700 font-medium">Cargando confirmaciones...</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6">
      {/* Header card */}
      <HeaderCard />

      {/* Stats */}
      <StatsCards
        counts={stats}
        active={
          (filters.date === "today" && "today") ||
          (filters.date === "week" && "week") ||
          (filters.date === "month" && "month") ||
          ""
        }
        onPick={(k) => setFilters((f) => ({ ...f, date: k }))}
      />

      {/* Filtros */}
      <Filters items={items} filters={filters} onChange={handleChange} />

      {/* Listado */}
      <PendingList items={filtered} />
    </div>
  );
}
