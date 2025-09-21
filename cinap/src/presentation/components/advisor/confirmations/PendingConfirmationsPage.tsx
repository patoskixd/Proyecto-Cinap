"use client";

import { useMemo, useState } from "react";
import type { PendingConfirmation } from "@domain/confirmations";

import { HeaderCard } from "./components/HeaderCard";
import { StatsCards } from "./components/StatsCard";
import Filters, { type Filters as FiltersT } from "./components/Filters";
import PendingList from "./components/PendingList";

import { startOfDay, todayISO, toLocalDate } from "./utils/date";

export default function PendingConfirmationsPage(props: { items: PendingConfirmation[] }) {
  const { items } = props;

  const [filters, setFilters] = useState<FiltersT>({ category: "", date: "", q: "" });
  const handleChange = (patch: Partial<FiltersT>) => setFilters((f) => ({ ...f, ...patch }));


  const nowStart = startOfDay(new Date());
  const weekEnd = new Date(nowStart); weekEnd.setDate(weekEnd.getDate() + 6);
  const monthStart = new Date(nowStart.getFullYear(), nowStart.getMonth(), 1);
  const monthEnd   = new Date(nowStart.getFullYear(), nowStart.getMonth() + 1, 0);

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
