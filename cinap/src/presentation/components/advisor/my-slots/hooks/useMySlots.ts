import { useCallback, useEffect, useMemo, useState } from "react";
import type { MySlot, SlotStatus } from "@/domain/advisor/mySlots";
import { HttpMySlotsRepo } from "@/infrastructure/advisor/my-slots/MySlotsHttpRepo";
import { GetMySlotsPage } from "@/application/advisor/my-slots/usecases/GetMySlotsPage";
import { UpdateMySlot } from "@/application/advisor/my-slots/usecases/UpdateMySlot";
import { DeleteMySlot } from "@/application/advisor/my-slots/usecases/DeleteMySlot";
import { ReactivateMySlot } from "@/application/advisor/my-slots/usecases/ReactivateMySlot";

export type Filters = {
  category: string;
  service: string;
  campus: string;
  status: "" | SlotStatus;
  date: string;
};

const repo = new HttpMySlotsRepo();

function campusFromLocation(location: string) {
  return (location || "").split(" / ")[0] || "";
}

export function useMySlots() {
  const [items, setItems] = useState<MySlot[]>([]);
  const [loading, setLoading] = useState(true);

  // página
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  // stats globales 
  const [stats, setStats] = useState<{ total: number; disponibles: number; ocupadasHM: string }>({
    total: 0, disponibles: 0, ocupadasHM: "0h 0m",
  });

  const [filters, setFilters] = useState<Filters>({
    category: "",
    service: "",
    campus: "",
    status: "",
    date: "",
  });

  const [cachedSelects, setCachedSelects] = useState<{
    categories: string[];
    services: string[];
    campuses: string[];
  }>({ categories: [], services: [], campuses: [] });

  const ucGetPage = useMemo(() => new GetMySlotsPage(repo), []);
  const ucUpdate = useMemo(() => new UpdateMySlot(repo), []);
  const ucDelete = useMemo(() => new DeleteMySlot(repo), []);
  const ucReactivate = useMemo(() => new ReactivateMySlot(repo), []);

  const loadPage = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await ucGetPage.exec({
        page: p,
        limit: 36,
        status: filters.status || "",
        date: filters.date || undefined,
        category: filters.category || undefined,
        service: filters.service || undefined,
        campus: filters.campus || undefined,
      });
      setItems(res.items);
      setPages(res.pages);
      // stats globales 
      const h = Math.floor((res.stats.ocupadas_min || 0) / 60);
      const m = (res.stats.ocupadas_min || 0) % 60;
      setStats({ total: res.stats.total, disponibles: res.stats.disponibles, ocupadasHM: `${h}h ${m}m` });
    } finally {
      setLoading(false);
    }
  }, [ucGetPage, filters]);

  // cargar cuando cambian page o filtros
  useEffect(() => { loadPage(page); }, [page, loadPage]);

  // al cambiar filtros, resetear a página 1
  const setFiltersAndReset = useCallback((updater: (prev: Filters) => Filters) => {
    setPage(1);
    setFilters(prev => updater(prev));
  }, []);

  // opciones select derivadas de la página actual
  const selectOptionsFromItems = useMemo(() => {
    const cats = new Set<string>(), svcs = new Set<string>(), camps = new Set<string>();
    for (const s of items) {
      if (s.category) cats.add(s.category);
      if (s.service) svcs.add(s.service);
      const c = campusFromLocation(s.location);
      if (c) camps.add(c);
    }
    const sort = (a: string, b: string) => a.localeCompare(b, "es");
    return {
      categories: Array.from(cats).sort(sort),
      services: Array.from(svcs).sort(sort),
      campuses: Array.from(camps).sort(sort),
    };
  }, [items]);

  useEffect(() => {
    const { categories, services, campuses } = selectOptionsFromItems;
    if (categories.length || services.length || campuses.length) {
      setCachedSelects(selectOptionsFromItems);
    }
  }, [selectOptionsFromItems]);

  const selectOptions =
    (selectOptionsFromItems.categories.length ||
     selectOptionsFromItems.services.length ||
     selectOptionsFromItems.campuses.length)
      ? selectOptionsFromItems
      : cachedSelects;

  // acciones
  const updateSlot = useCallback(async (id: string, patch: MySlot) => {
    const payload: Partial<MySlot> = {
      date: patch.date,
      time: patch.time,
      notes: patch.notes ?? "",
    };
    const updated = await ucUpdate.exec(id, payload);
    setItems(prev => prev.map(s => (s.id === id ? updated : s)));
    return updated;
  }, [ucUpdate]);

  const deleteSlot = useCallback(async (id: string) => {
    await ucDelete.exec(id);
    setItems(prev => prev.filter(s => s.id !== id));
  }, [ucDelete]);

  const reactivateSlot = useCallback(async (id: string) => {
    const updated = await ucReactivate.exec(id);
    setItems(prev => prev.map(s => (s.id === id ? updated : s)));
    return updated;
  }, [ucReactivate]);

  const disableSlot = useCallback(async (id: string) => {
    const updated = await ucUpdate.exec(id, { status: "cancelado" as const });
    setItems(prev => prev.map(s => (s.id === id ? updated : s)));
    return updated;
  }, [ucUpdate]);

  return {
    // datos
    slots: items,
    filtered: items,
    loading,
    stats,
    // paginación
    page, pages, setPage,
    // filtros
    filters, setFilters: setFiltersAndReset,
    // acciones
    updateSlot, deleteSlot, reactivateSlot, disableSlot,
    // selects
    selectOptions,
  };
}

