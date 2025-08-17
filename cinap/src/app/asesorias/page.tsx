
//  componentes de la página de reservas de asesorías

import ReservationsHeader from "@/presentation/components/asesorias/ReservationsHeader";
import ReservationsView from "@/presentation/components/asesorias/ReservationsView";
import { getReservationsData } from "@/application/asesorias/getReservationsData";


import ChatWidget from "@/presentation/components/chat/ChatWidget";
export default async function ReservationsPage() {
  const { upcoming, past } = await getReservationsData();

  return (
    <main className="bg-[linear-gradient(135deg,#f8fafc_0%,#e2e8f0_100%)]">
      <div className="mx-auto max-w-[1200px] px-4 py-6 md:py-8">
        <ReservationsHeader />
        <ReservationsView upcoming={upcoming} past={past} />
        <ChatWidget />
      </div>
    </main>
  );
}
