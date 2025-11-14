import type { Metadata } from "next";
import PendingConfirmationsPage from "@/presentation/components/advisor/confirmations/PendingConfirmationsPage";
import { HttpConfirmationsRepo } from "@/infrastructure/advisor/confirmations/ConfirmationsHttpRepo";
import { GetPendingConfirmations } from "@/application/advisor/confirmations/usecases/GetPendingConfirmations";
import type { PendingConfirmation } from "@/domain/advisor/confirmations";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Pendientes por confirmar | CINAP UCT",
    description: "Revisa y gestiona las solicitudes de asesoria que estan pendientes de confirmacion.",
  };
}

export default async function PendingConfirmationsRoute() {
  const repo = new HttpConfirmationsRepo();

  let items: PendingConfirmation[] = [];
  items = await new GetPendingConfirmations(repo).exec();

  return (
    <main className="bg-[linear-gradient(135deg,#f8fafc_0%,#e2e8f0_100%)]">
      <div className="mx-auto max-w-[1200px] px-4 py-6 md:py-8">
        <PendingConfirmationsPage items={items} />
      </div>
    </main>
  );
}
