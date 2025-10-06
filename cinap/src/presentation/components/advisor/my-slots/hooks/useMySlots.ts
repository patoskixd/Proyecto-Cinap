import { useCallback, useEffect, useMemo, useState } from "react";
import type { MySlot, SlotStatus } from "@/domain/advisor/mySlots";
import { HttpMySlotsRepo } from "@/infrastructure/advisor/my-slots/MySlotsHttpRepo";
import { GetMySlots } from "@/application/advisor/my-slots/usecases/GetMySlots";
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
  const [slots, setSlots] = useState<MySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    category: "",
    service: "",
    campus: "",          
    status: "",
    date: "",
  });

  const ucGet = useMemo(() => new GetMySlots(repo), []);
  const ucUpdate = useMemo(() => new UpdateMySlot(repo), []);
  const ucDelete = useMemo(() => new DeleteMySlot(repo), []);
  const ucReactivate = useMemo(() => new ReactivateMySlot(repo), []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ucGet.exec();
      setSlots(data);
    } finally {
      setLoading(false);
    }
  }, [ucGet]);

  useEffect(() => { refresh(); }, [refresh]);

  const selectOptions = useMemo(() => {
    const cats = new Set<string>();
    const svcs = new Set<string>();
    const camps = new Set<string>();
    for (const s of slots) {
      if (s.category) cats.add(s.category);
      if (s.service) svcs.add(s.service);
      const c = campusFromLocation(s.location);
      if (c) camps.add(c);
    }
    // orden alfabético
    const sort = (a: string, b: string) => a.localeCompare(b, "es");
    return {
      categories: Array.from(cats).sort(sort),
      services: Array.from(svcs).sort(sort),
      campuses: Array.from(camps).sort(sort),
    };
  }, [slots]);

  const filtered = useMemo(() => {
    const cat = filters.category.trim().toLowerCase();
    const svc = filters.service.trim().toLowerCase();
    const camp = filters.campus.trim().toLowerCase();
    return slots.filter(s =>
      (!cat || s.category.toLowerCase() === cat) &&
      (!svc || s.service.toLowerCase() === svc) &&
      (!camp || campusFromLocation(s.location).toLowerCase() === camp) &&
      (!filters.status || s.status === filters.status) &&
      (!filters.date || s.date === filters.date)
    );
  }, [slots, filters]);

  const stats = useMemo(() => {
    const disponibles = slots.filter(s => s.status === "disponible").length;
    const ocupadasMin = slots.filter(s => s.status === "ocupado").reduce((acc, s) => acc + s.duration, 0);
    const h = Math.floor(ocupadasMin / 60);
    const m = ocupadasMin % 60;
    return { disponibles, ocupadasMin, ocupadasHM: `${h}h ${m}m` };
    }, [slots]);


    const updateSlot = useCallback(async (id: string, patch: MySlot) => {
    const payload: Partial<MySlot> = {
      date: patch.date,
      time: patch.time,
      notes: patch.notes ?? "",
        };
    const updated = await ucUpdate.exec(id, payload);
    setSlots(prev => prev.map(s => (s.id === id ? updated : s)));
    return updated;
    }, [ucUpdate]);



  const deleteSlot = useCallback(async (id: string) => {
    await ucDelete.exec(id);
    setSlots(prev => prev.filter(s => s.id !== id));
    }, [ucDelete]);

  const reactivateSlot = useCallback(async (id: string) => {
    const updated = await ucReactivate.exec(id);
    setSlots(prev => prev.map(s => (s.id === id ? updated : s)));
    return updated;
    }, [ucReactivate]);

  const disableSlot = useCallback(async (id: string) => {
    const updated = await ucUpdate.exec(id, { status: "cancelado" as const });
    setSlots(prev => prev.map(s => (s.id === id ? updated : s)));
    return updated;
    }, [ucUpdate]);

  return {slots, loading, filtered, stats, filters, setFilters, refresh, updateSlot, deleteSlot, reactivateSlot, disableSlot, selectOptions};
}
