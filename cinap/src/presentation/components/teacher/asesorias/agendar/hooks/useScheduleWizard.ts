"use client";

import { useEffect, useMemo, useState } from "react";
import type {FoundSlot } from "@/domain/scheduling";
import type { Advisor, Category, CategoryId, Service, WizardState } from "../types";
import { SchedulingHttpRepo } from "@/infrastructure/asesorias/agendar/SchedulingHttpRepo";
import { isPastDate, startOfDay } from "../utils/date";

export function useScheduleWizard({
  categories,
  servicesByCategory,
  advisorsByService,
  defaultTimezone,
}: {
  categories: Category[];
  servicesByCategory: Record<CategoryId, Service[]>;
  advisorsByService: Record<string, Advisor[]>;
  defaultTimezone: string;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [state, setState] = useState<WizardState>({
    categoryId: undefined,
    serviceId: undefined,
    advisorId: undefined,
    slot: null,
    notes: "",
  });

  const services = useMemo<Service[]>(
    () => (state.categoryId ? servicesByCategory[state.categoryId] ?? [] : []),
    [state.categoryId, servicesByCategory]
  );
  const advisors = useMemo<Advisor[]>(
    () => (state.serviceId ? advisorsByService[state.serviceId] ?? [] : []),
    [state.serviceId, advisorsByService]
  );

  const [currentMonth, setCurrentMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  useEffect(() => {
    if (selectedDate && isPastDate(selectedDate)) {
      const today = startOfDay(new Date());
      const sameMonthAsToday =
        currentMonth.getFullYear() === today.getFullYear() &&
        currentMonth.getMonth() === today.getMonth();
      setSelectedDate(sameMonthAsToday ? today : null);
    }
    setState((s) => ({ ...s, slot: null }));
  }, [currentMonth]);

  useEffect(() => {
    setState((s) => ({ ...s, slot: null }));
  }, [selectedDate]);

  const api = new SchedulingHttpRepo();
  const [openSlots, setOpenSlots] = useState<FoundSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSlots() {
      setOpenSlots([]);
      setSlotsError(null);
      if (!state.serviceId || !state.advisorId || !selectedDate) return;
      setLoadingSlots(true);
      try {
        const dateStr = selectedDate.toISOString().slice(0, 10);
        const slots = await api.findSlots({
          serviceId: state.serviceId,
          dateFrom: dateStr,
          dateTo: dateStr,
        });
        setOpenSlots(Array.isArray(slots) ? slots : []);
      } catch (e: any) {
        setSlotsError(e?.message || "Error consultando cupos");
      } finally {
        setLoadingSlots(false);
      }
    }
    fetchSlots();
  }, [state.serviceId, state.advisorId, selectedDate]);

  const selectCategory = (id: CategoryId) =>
    setState((s) => ({ ...s, categoryId: id, serviceId: undefined, advisorId: undefined, slot: null }));

  const selectService = (id: string) =>
    setState((s) => ({ ...s, serviceId: id, advisorId: undefined, slot: null }));

  const selectAdvisor = (id: string) =>
    setState((s) => ({ ...s, advisorId: id, slot: null }));

  const selectSlot = (slot: FoundSlot) => {
    setState((s) => ({
      ...s,
      slot: {
        dayIndex: new Date(slot.date).getDay(),
        start: slot.time,
        end: "",
        timezone: defaultTimezone,
        date: slot.date,
        cupoId: slot.cupoId,
        location: [slot.campus, slot.building, slot.resourceAlias].filter(Boolean).join(" / ") || undefined,
        room: slot.roomNumber || undefined,
      },
    }));
  };

  const canGoNext =
    (step === 1 && !!state.categoryId && !!state.serviceId && !!state.advisorId) ||
    (step === 2 && !!state.slot);

  const goNext = () => {
    if (step < 3 && canGoNext) setStep((s) => (s + 1) as 2 | 3);
  };
  const goPrev = () => {
    if (step > 1) setStep((s) => (s - 1) as 1 | 2);
  };

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  async function onConfirmar() {
    setError(null);
    if (!state.serviceId || !state.advisorId) {
      setError("Falta seleccionar servicio y asesor.");
      return;
    }
    if (!state.slot || !state.slot.date || !(state.slot as any).cupoId) {
      setError("Selecciona fecha y hora.");
      return;
    }

    try {
      setSubmitting(true);
      await api.reserve({
        cupo_id: (state.slot as any).cupoId,
        origen: "web",
        notas: state.notes ?? undefined,
      });
      setShowSuccess(true);
    } catch (e: any) {
      setError(e?.message ?? "Error al confirmar");
    } finally {
      setSubmitting(false);
    }
  }

  return { step, setStep, state, setState, services, advisors, currentMonth, setCurrentMonth, selectedDate, setSelectedDate, openSlots,
           loadingSlots, slotsError, selectCategory, selectService, selectAdvisor, selectSlot, canGoNext, goNext, goPrev, submitting,
           error, showSuccess, setShowSuccess, onConfirmar, } as const;
}
