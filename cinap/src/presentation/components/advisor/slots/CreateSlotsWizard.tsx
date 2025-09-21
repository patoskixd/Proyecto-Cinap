"use client";

import { useEffect, useMemo, useState } from "react";
import type { Category, CategoryId, Service } from "./types";
import type { Resource, SlotRule } from "@domain/slots";
import { normalizeSchedules, type UIRule } from "@application/slots/usecases/NormalizeSchedules";
import { GetCreateSlotsData } from "@application/slots/usecases/GetCreateSlotsData";
import { CreateSlots } from "@application/slots/usecases/CreateSlots";
import { SlotsHttpRepo } from "@/infrastructure/slots/SlotsHttpRepo";

import Header from "./components/Header";
import Progress from "./components/Progress";
import FooterNav from "./components/FooterNav";
import SuccessModal from "./components/SuccessModal";
import Step1Service from "./steps/Step1Service";
import Step2Place from "./steps/Step2Place";
import Step3Schedules from "./steps/Step3Schedules";
import Step4Confirm from "./steps/Step4Confirm";
import ErrorModal from "./components/ErrorModal";

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

  const toMin = (hhmm: string) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
  const slotsFor = (start: string, end: string) => Math.max(0, Math.floor((toMin(end) - toMin(start)) / (durationMin || 60)));
  const totalSlots = useMemo(
    () => normalized.merged.reduce((acc, s) => acc + slotsFor(s.startTime, s.endTime), 0),
    [normalized.merged, durationMin]
  );


  const submit = async () => {
  if (!serviceId || !recursoId) return;

    const repo = new SlotsHttpRepo();
    const uc = new CreateSlots(repo);

    try {
      const res = await uc.exec({
        advisorId: undefined,
        categoryId: categoryId!,
        serviceId,
        recursoId,
        location: "",
        room: "",
        roomNotes,
        schedules: normalized.merged as unknown as SlotRule[],
      } as any);

      setCreatedCount(res.createdSlots);
      setShowSuccess(true);

    } catch (e: any) {
      if (e?.status === 409) {
        setErrorMsg(e?.message ?? "Este recurso ya tiene cupos en esos horarios.");
        setErrorConflicts(Array.isArray(e?.detail?.conflicts) ? e.detail.conflicts : []);
        setShowError(true);
        return;
      }
      setErrorMsg(e?.message ?? "Ocurrió un error al crear los cupos.");
      setErrorConflicts([]);
      setShowError(true);
    }
  };



  if (loading) {
    return (
      <div className="mx-auto max-w-[900px] rounded-2xl bg-white p-8 text-center">
        <span className="text-black">Cargando datos…</span>
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
        <SuccessModal open={showSuccess} total={createdCount} onClose={() => setShowSuccess(false)} />
        <ErrorModal open={showError} message={errorMsg} conflicts={errorConflicts} onClose={() => setShowError(false)}/>

      </section>
    </div>
  );
}
