"use client";

import { useEffect, useMemo, useState } from "react";
import type { Category, CategoryId, Service } from "./types";
import type { Resource, SlotRule } from "@/domain/advisor/slots";
import { normalizeSchedules, type UIRule } from "@/application/advisor/slots/usecases/NormalizeSchedules";
import { GetCreateSlotsData } from "@/application/advisor/slots/usecases/GetCreateSlotsData";
import { CreateSlots } from "@/application/advisor/slots/usecases/CreateSlots";
import { SlotsHttpRepo } from "@/infrastructure/advisor/slots/SlotsHttpRepo";
import { HttpError } from "@/infrastructure/http/client";

import Header from "./components/Header";
import Progress from "./components/Progress";
import FooterNav from "./components/FooterNav";
import SuccessModal from "./components/SuccessModal";
import Step1Service from "./steps/Step1Service";
import Step2Place from "./steps/Step2Place";
import Step3Schedules from "./steps/Step3Schedules";
import Step4Confirm from "./steps/Step4Confirm";
import ErrorModal from "./components/ErrorModal";
import LoadingStateCard from "@/presentation/components/shared/LoadingStateCard";

export default function CreateSlotsWizard() {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [servicesByCategory, setServicesByCategory] = useState<Record<CategoryId, Service[]>>({} as Record<CategoryId, Service[]>);
  const [times, setTimes] = useState<string[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [showError, setShowError] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>();
  const [errorConflicts, setErrorConflicts] = useState<Array<{cupoId?: string; inicio: string; fin: string}>>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const repo = new SlotsHttpRepo();
        const data = await new GetCreateSlotsData(repo).exec();
        setCategories(data.categories as unknown as Category[]);
        setServicesByCategory(data.servicesByCategory as unknown as Record<CategoryId, Service[]>);
        setTimes(data.times);
        setResources((data as any).resources ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);


  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [categoryId, setCategoryId] = useState<CategoryId | undefined>();
  const [serviceId, setServiceId] = useState<string | undefined>();
  const [recursoId, setRecursoId] = useState<string | undefined>();
  const [roomNotes, setRoomNotes] = useState("");

  const [schedules, setSchedules] = useState<UIRule[]>([]);
  const normalized = useMemo(() => normalizeSchedules(schedules), [schedules]);


  const services = useMemo<Service[]>(
    () => (categoryId ? (servicesByCategory[categoryId] ?? []) : []),
    [categoryId, servicesByCategory]
  );
  const selectedService = services.find((s) => s.id === serviceId);
  const durationMin = selectedService ? parseInt(selectedService.duration, 10) || 60 : 60;
  const selectedResource = resources.find((r) => r.id === recursoId);


  const prev = () => setStep((s) => (s === 1 ? 1 : ((s - 1) as 1 | 2 | 3 | 4)));
  const next = () => setStep((s) => (s === 4 ? 4 : ((s + 1) as 1 | 2 | 3 | 4)));

  const canNext =
    (step === 1 && !!categoryId && !!serviceId) ||
    (step === 2 && !!recursoId) ||
    (step === 3 && normalized.merged.length > 0);


  const [showSuccess, setShowSuccess] = useState(false);
  const [createdCount, setCreatedCount] = useState<number>(0);
  const [skippedCount, setSkippedCount] = useState<number>(0);

  const submit = async () => {
    if (!serviceId || !recursoId) return;

    const repo = new SlotsHttpRepo();
    const uc = new CreateSlots(repo);
    const resourceLabel = selectedResource
      ? [selectedResource.campus, selectedResource.building].filter(Boolean).join(" — ")
      : "";
    const roomLabel = selectedResource
      ? [selectedResource.alias, selectedResource.number].filter(Boolean).join(" — ")
      : "";

    if (process.env.NODE_ENV !== "production") {
      console.debug("[CreateSlotsWizard] schedules", normalized.merged);
    }

    try {
      const res = await uc.exec({
        advisorId: undefined,
        categoryId: categoryId!,
        serviceId,
        recursoId,
        location: resourceLabel,
        room: roomLabel,
        roomNotes,
        schedules: normalized.merged as unknown as SlotRule[],
      } as any);

      setCreatedCount(res.createdSlots);
      setSkippedCount(res.skipped ?? 0);
      setShowSuccess(true);

    } catch (error: unknown) {
      const err = error as HttpError & { detail?: any };
      const conflicts = Array.isArray(err?.detail?.conflicts) ? err.detail.conflicts : [];

      const rawMessage =
        typeof err?.detail === "string"
          ? err.detail
          : typeof err?.detail?.message === "string"
            ? err.detail.message
            : err instanceof Error
              ? err.message
              : "";

      const message =
        typeof rawMessage === "string"
          ? rawMessage.replace(/^HTTP\s\d+:\s*/, "").trim()
          : "";

      if (err instanceof HttpError && err.status === 409) {
        setErrorMsg(message || "Las siguientes horas ya están ocupadas para este recurso.");
        setErrorConflicts(conflicts);
        setShowError(true);
        return;
      }

      setErrorMsg(message || "Ocurrió un error al crear los cupos.");
      setErrorConflicts(conflicts);
      setShowError(true);
    }
  };



  if (loading) {
    return (
      <div className="mx-auto max-w-[900px]">
        <LoadingStateCard
          title="Cargando datos..."
          subtitle="Preparando la información necesaria para crear tus cupos"
        />
      </div>
    );
  }



  return (
    <div className="mx-auto max-w-[1100px] space-y-6">
      <Header />

      <section className="mx-auto max-w-[900px] overflow-hidden rounded-2xl bg-white shadow-[0_10px_30px_rgba(0,0,0,0.08)] ring-1 ring-slate-100">
        <Progress step={step} />

        {step === 1 && (
          <Step1Service
            categories={categories}
            servicesByCategory={servicesByCategory}
            categoryId={categoryId}
            serviceId={serviceId}
            setCategoryId={setCategoryId}
            setServiceId={setServiceId}
          />
        )}

        {step === 2 && (
          <Step2Place
            resources={resources}
            recursoId={recursoId}
            setRecursoId={setRecursoId}
            roomNotes={roomNotes}
            setRoomNotes={setRoomNotes}
          />
        )}

        {step === 3 && (
          <Step3Schedules
            times={times}
            schedules={schedules}
            setSchedules={(upd) => {
              const next = typeof upd === "function" ? (upd as any)(schedules) : upd;
              setSchedules(next);
            }}
          />
        )}

        {step === 4 && (
          <Step4Confirm
            categories={categories}
            servicesByCategory={servicesByCategory}
            categoryId={categoryId}
            serviceId={serviceId}
            resource={selectedResource}
            schedules={normalized.merged}
            serviceDurationMin={durationMin}
            notes={roomNotes}
          />
        )}

        <FooterNav step={step} canNext={!!canNext} prev={prev} next={next} submit={submit} />
        <SuccessModal open={showSuccess} total={createdCount} skipped={skippedCount} />
        <ErrorModal open={showError} message={errorMsg} conflicts={errorConflicts} onClose={() => setShowError(false)}/>

      </section>
    </div>
  );
}
