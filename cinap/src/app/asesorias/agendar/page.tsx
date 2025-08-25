import ScheduleHeader from "@/presentation/components/teacher/asesorias-agendar/ScheduleHeader";
import ScheduleWizard from "@/presentation/components/teacher/asesorias-agendar/ScheduleWizard";
import ChatWidget from "@/presentation/components/shared/widgets/ChatWidget";

import { GetSchedulingData } from "@app/asesorias/agendar/usecases/GetSchedulingData";
import { InMemorySchedulingRepo } from "@infrastructure/asesorias/agendar/InMemorySchedulingRepo";

export default async function NewAppointmentPage() {
  const usecase = new GetSchedulingData(new InMemorySchedulingRepo());
  const data = await usecase.exec();

  return (
    <main className="bg-[linear-gradient(135deg,#f8fafc_0%,#e2e8f0_100%)]">
      <div className="mx-auto max-w-[1200px] px-4 py-6 md:py-8">
        <ScheduleHeader />
        <ScheduleWizard {...data} />
        <ChatWidget />
      </div>
    </main>
  );
}
