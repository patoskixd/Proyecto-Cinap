// src/app/asesoria/agendar/page.tsx
import ScheduleHeader from "@/presentation/components/asesorias-agendar/ScheduleHeader";
import ScheduleWizard from "@/presentation/components/asesorias-agendar/ScheduleWizard";
import { getSchedulingData } from "@/application/asesorias/agendar/getSchedulingData";

import ChatWidget from "@/presentation/components/chat/ChatWidget";
export default async function NewAppointmentPage() {
  const data = await getSchedulingData();

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
