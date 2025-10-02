import ReservationsHeader from "@presentation/components/asesorias/ReservationsHeader";
import ReservationsView from "@presentation/components/asesorias/ReservationsView";
import ChatWidget from "@presentation/components/shared/widgets/ChatWidget";

import { GetReservations } from "@application/asesorias/usecases/GetReservations";
import { InMemoryReservationsRepo } from "@infrastructure/asesorias/InMemoryReservationsRepo";

export default async function ReservationsPage() {
  const usecase = new GetReservations(new InMemoryReservationsRepo());
  const { upcoming, past } = await usecase.exec();

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
