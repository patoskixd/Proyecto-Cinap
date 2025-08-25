import PendingConfirmationsPage from "@/presentation/components/advisor/confirmations/PendingConfirmationsPage";
import { InMemoryConfirmationsRepo } from "@infrastructure/confirmations/InMemoryConfirmationsRepo";
import { GetPendingConfirmations } from "@application/confirmations/usecases/GetPendingConfirmations";

export const dynamic = "force-static"; // mock

export default async function PendingConfirmationsRoute() {
  const repo = new InMemoryConfirmationsRepo();
  const items = await new GetPendingConfirmations(repo).exec();

  return (
    <main className="bg-[linear-gradient(135deg,#f8fafc_0%,#e2e8f0_100%)]">
      <div className="mx-auto max-w-[1200px] px-4 py-6 md:py-8">
        <PendingConfirmationsPage items={items} />
      </div>
    </main>
  );
}
