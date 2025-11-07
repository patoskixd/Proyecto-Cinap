"use client";

import { useEffect, useMemo, useState } from "react";
import type { FoundSlot, CalendarConflict } from "@/domain/teacher/scheduling";
import type { Advisor, CategoryId, Service, WizardState } from "../types";
import { SchedulingHttpRepo } from "@/infrastructure/teachers/asesorias/agendar/SchedulingHttpRepo";
import { isPastDate, startOfDay } from "../utils/date";
import { notify } from "@/presentation/components/shared/Toast/ToastProvider";

export function useScheduleWizard({
  servicesByCategory,
  advisorsByService,
  defaultTimezone,
}: {
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
  }, [currentMonth, selectedDate, setState, setSelectedDate]);

  useEffect(() => {
    setState((s) => ({ ...s, slot: null }));
  }, [selectedDate, setState]);

  const api = useMemo(() => new SchedulingHttpRepo(), []);
  const [openSlots, setOpenSlots] = useState<FoundSlot[]>([]);
  const [monthSlots, setMonthSlots] = useState<FoundSlot[]>([]);
  const [daysWithAvailability, setDaysWithAvailability] = useState<Set<string>>(new Set());
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingMonth, setLoadingMonth] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  // Fetch slots for the entire month to know which days have availability
  useEffect(() => {
    async function fetchMonthSlots() {
      setMonthSlots([]);
      setDaysWithAvailability(new Set());
      if (!state.serviceId || !state.advisorId) return;
      
      setLoadingMonth(true);
      try {
        const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
        
        const dateFrom = firstDay.toISOString().slice(0, 10);
        const dateTo = lastDay.toISOString().slice(0, 10);
        
        const slots = await api.findSlots({
          serviceId: state.serviceId,
          dateFrom,
          dateTo,
        });
        
        const now = new Date();
        const sanitized = (Array.isArray(slots) ? slots : []).filter((slot) => {
          if (!slot?.date || !slot?.time) return false;
          const slotDate = new Date(`${slot.date}T${slot.time}`);
          if (Number.isNaN(slotDate.getTime())) return false;
          return slotDate.getTime() > now.getTime();
        });
        
        setMonthSlots(sanitized);
        
        // Create a set of dates that have availability
        const daysSet = new Set<string>();
        sanitized.forEach((slot) => {
          if (slot.date) {
            daysSet.add(slot.date.slice(0, 10));
          }
        });
        setDaysWithAvailability(daysSet);
      } catch (e: any) {
        const message = e?.message || "Error consultando disponibilidad mensual";
        notify(message, "error");
      } finally {
        setLoadingMonth(false);
      }
    }
    fetchMonthSlots();
  }, [state.serviceId, state.advisorId, currentMonth, api]);

  // Fetch slots for selected day
  useEffect(() => {
    async function fetchSlots() {
      setOpenSlots([]);
      setSlotsError(null);
      if (!state.serviceId || !state.advisorId || !selectedDate) return;
      
      setLoadingSlots(true);
      try {
        const dateStr = selectedDate.toISOString().slice(0, 10);
        
        // Filter from month slots for better performance
        const daySlots = monthSlots.filter((slot) => slot.date?.slice(0, 10) === dateStr);
        
        setOpenSlots(daySlots);
        setState((prev) => {
          if (!prev.slot) return prev;
          const exists = daySlots.some((slot) => slot.cupoId === prev.slot?.cupoId);
          return exists ? prev : { ...prev, slot: null };
        });
      } catch (e: any) {
        const message = e?.message || "Error consultando cupos";
        setSlotsError(message);
        notify(message, "error");
      } finally {
        setLoadingSlots(false);
      }
    }
    fetchSlots();
  }, [state.serviceId, state.advisorId, selectedDate, monthSlots, setState]);

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
  
  // Estados para conflictos de calendario
  const [conflicts, setConflicts] = useState<CalendarConflict[]>([]);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [checkingConflicts, setCheckingConflicts] = useState(false);

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

    // Verificar conflictos de calendario antes de confirmar
    try {
      setCheckingConflicts(true);
      const slotData = openSlots.find((s) => s.cupoId === state.slot?.cupoId);
      
      if (slotData) {
        const startDateTime = new Date(`${slotData.date}T${slotData.time}`);
        const endDateTime = new Date(startDateTime.getTime() + (slotData.duration || 60) * 60000);
        
        const result = await api.checkConflicts({
          start: startDateTime.toISOString(),
          end: endDateTime.toISOString(),
        });
        
        if (result.conflicts && result.conflicts.length > 0) {
          setConflicts(result.conflicts);
          setShowConflictModal(true);
          setCheckingConflicts(false);
          return;
        }
      }
    } catch (e: any) {
      console.warn("Error verificando conflictos:", e);
    } finally {
      setCheckingConflicts(false);
    }

    // Si no hay conflictos o hubo error verificando, proceder con la reserva
    await executeReservation();
  }

  async function executeReservation() {
    setError(null);
    setShowConflictModal(false);
    
    try {
      setSubmitting(true);
      await api.reserve({
        cupo_id: (state.slot as any).cupoId,
        origen: "web",
        notas: state.notes ?? undefined,
      });
      setShowSuccess(true);
      setConflicts([]);
    } catch (e: any) {
      setError(e?.message ?? "Error al confirmar");
    } finally {
      setSubmitting(false);
    }
  }

  return { step, setStep, state, setState, services, advisors, currentMonth, setCurrentMonth, selectedDate, setSelectedDate, openSlots,
           daysWithAvailability, loadingSlots, loadingMonth, slotsError, selectCategory, selectService, selectAdvisor, selectSlot, canGoNext, goNext, goPrev, submitting,
           error, setError, showSuccess, setShowSuccess, onConfirmar, conflicts, showConflictModal, setShowConflictModal, executeReservation, checkingConflicts, } as const;
}
