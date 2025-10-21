
import { useCallback, useEffect, useMemo, useState } from "react";

import type { Reservation } from "@/domain/reservation";
import {
  type ReservationListFilters,
  type ReservationListParams,
  type ReservationTab,
} from "@/application/teacher/asesorias/ports/ReservationsRepo";
import { ReservationsHttpRepo } from "@/infrastructure/reservations/ReservationsHttpRepo";
import { GetReservationsPage } from "@/application/teacher/asesorias/usecases/GetReservationsPage";
import { CancelReservation } from "@/application/teacher/asesorias/usecases/CancelReservation";
import { ConfirmReservation } from "@/application/teacher/asesorias/usecases/ConfirmReservation";

export type ReservationsFilters = {
  category: string;
  service: string;
  status: string;
  dateFrom: string;
};

const INITIAL_FILTERS: ReservationsFilters = {
  category: "",
  service: "",
  status: "",
  dateFrom: "",
};

type ActionState = {
  id: string | null;
  type: "cancel" | "confirm" | null;
};

function sanitizeFilters(filters: ReservationsFilters): ReservationListFilters {
  const result: ReservationListFilters = {};
  if (filters.category) result.category = filters.category;
  if (filters.service) result.service = filters.service;
  if (filters.status) result.status = filters.status;
  if (filters.dateFrom) result.dateFrom = filters.dateFrom;
  return result;
}

export function useReservations() {
  const repo = useMemo(() => new ReservationsHttpRepo(), []);
  const getPage = useMemo(() => new GetReservationsPage(repo), [repo]);
  const cancelUc = useMemo(() => new CancelReservation(repo), [repo]);
  const confirmUc = useMemo(() => new ConfirmReservation(repo), [repo]);

  const [tab, setTabState] = useState<ReservationTab>("upcoming");
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<ReservationsFilters>(INITIAL_FILTERS);
  const [items, setItems] = useState<Reservation[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [totals, setTotals] = useState<Record<ReservationTab, number>>({
    upcoming: 0,
    past: 0,
  });
  const [capabilities, setCapabilities] = useState<{ canCancel: boolean; canConfirm: boolean }>({
    canCancel: false,
    canConfirm: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionState, setActionState] = useState<ActionState>({ id: null, type: null });

  const load = useCallback(
    async (kind: ReservationTab, pageNumber: number, currentFilters: ReservationsFilters) => {
      setLoading(true);
      setError(null);
      try {
        const sanitizedFilters = sanitizeFilters(currentFilters);
        const params: ReservationListParams = {
          tab: kind,
          page: pageNumber,
          limit: 30,
          filters: sanitizedFilters,
        };
        const result = await getPage.exec(params);
        setItems(result.items);
        setTotal(result.total);
        setPages(result.pages);
        setCapabilities(result.capabilities);

        const upcomingTotalPromise =
          kind === "upcoming"
            ? Promise.resolve(result.total)
            : getPage
                .exec({ tab: "upcoming", page: 1, limit: 1, filters: sanitizedFilters })
                .then((r) => r.total)
                .catch(() => 0);

        const pastTotalPromise =
          kind === "past"
            ? Promise.resolve(result.total)
            : getPage
                .exec({ tab: "past", page: 1, limit: 1, filters: sanitizedFilters })
                .then((r) => r.total)
                .catch(() => 0);

        const [upcomingTotal, pastTotal] = await Promise.all([upcomingTotalPromise, pastTotalPromise]);
        setTotals({ upcoming: upcomingTotal, past: pastTotal });
      } catch (e: any) {
        console.error("Error loading reservations", e);
        setItems([]);
        setTotal(0);
        setPages(1);
        setError(e?.message ?? "No se pudieron cargar las asesorías");
      } finally {
        setLoading(false);
      }
    },
    [getPage]
  );

  useEffect(() => {
    load(tab, page, filters);
  }, [load, tab, page, filters]);

  const setTab = useCallback((next: ReservationTab) => {
    setTabState(next);
    setPage(1);
  }, []);

  const setFiltersAndReset = useCallback((updater: (prev: ReservationsFilters) => ReservationsFilters) => {
    setPage(1);
    setFilters((prev) => updater(prev));
  }, []);

  const cancelReservation = useCallback(
    async (id: string) => {
      setActionState({ id, type: "cancel" });
      try {
        await cancelUc.exec(id);
        await load(tab, page, filters);
      } finally {
        setActionState({ id: null, type: null });
      }
    },
    [cancelUc, load, tab, page, filters]
  );

  const confirmReservation = useCallback(
    async (id: string) => {
      setActionState({ id, type: "confirm" });
      try {
        await confirmUc.exec(id);
        await load(tab, page, filters);
      } finally {
        setActionState({ id: null, type: null });
      }
    },
    [confirmUc, load, tab, page, filters]
  );

  return {
    tab,
    setTab,
    page,
    setPage,
    pages,
    total,
    totals,
    filters,
    setFilters: setFiltersAndReset,
    items,
    loading,
    error,
    capabilities,
    cancelReservation,
    confirmReservation,
    actionState,
  };
}

export type ReservationsState = ReturnType<typeof useReservations>;

