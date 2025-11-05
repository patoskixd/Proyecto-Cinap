"use client";

import type { Advisor, Category, CategoryId, Service } from "./types";
import { Progress } from "./components/Progress";
import { FooterNav } from "./components/FooterNav";
import { SuccessModal } from "./components/SuccessModal";
import { ErrorModal } from "./components/ErrorModal";
import { Step1Select } from "./steps/Step1Select";
import { Step2Calendar } from "./steps/Step2Calendar";
import { Step3Confirm } from "./steps/Step3Confirm";
import { useScheduleWizard } from "./hooks/useScheduleWizard";
import Header from "./components/Header";


export default function ScheduleWizard(props: {
  categories: Category[];
  servicesByCategory: Record<CategoryId, Service[]>;
  advisorsByService: Record<string, Advisor[]>;
  daysShort: string[]; 
  times: string[];     
  defaultTimezone: string;
}) {
  const { categories, servicesByCategory, advisorsByService, defaultTimezone } = props;

  const { step, state, services, advisors, currentMonth, setCurrentMonth, selectedDate, setSelectedDate, openSlots,
          daysWithAvailability, loadingSlots, loadingMonth, slotsError, selectCategory, selectService, selectAdvisor, selectSlot, canGoNext, goNext,
          goPrev, submitting, error, showSuccess, onConfirmar, setError } = useScheduleWizard({ servicesByCategory, advisorsByService, defaultTimezone });

  return (
    <div className="mx-auto max-w-[1100px] space-y-6">
        <Header />
      <section className="mx-auto max-w-[900px] overflow-hidden rounded-2xl bg-white shadow-[0_10px_30px_rgba(0,0,0,0.08)] ring-1 ring-slate-100">
        <Progress step={step} />

        {step === 1 && (
          <Step1Select
            categories={categories}
            services={services}
            advisors={advisors}
            state={state}
            selectCategory={selectCategory}
            selectService={selectService}
            selectAdvisor={selectAdvisor}
          />
        )}

        {step === 2 && (
          <Step2Calendar
            currentMonth={currentMonth}
            setCurrentMonth={setCurrentMonth}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            state={state}
            openSlots={openSlots}
            daysWithAvailability={daysWithAvailability}
            loading={loadingSlots}
            loadingMonth={loadingMonth}
            error={slotsError}
            onSelectSlot={selectSlot}
          />
        )}

        {step === 3 && (
          <Step3Confirm
            categories={categories}
            services={services}
            advisors={advisors}
            state={state}
            openSlots={openSlots}
            defaultTimezone={defaultTimezone}
          />
        )}

        <FooterNav
          step={step}
          submitting={submitting}
          canGoNext={canGoNext}
          onPrev={goPrev}
          onNext={goNext}
          onConfirm={onConfirmar}
        />

        <ErrorModal message={error} onClose={() => setError(null)} />
        <SuccessModal open={showSuccess} />
      </section>
    </div>
  );
}
