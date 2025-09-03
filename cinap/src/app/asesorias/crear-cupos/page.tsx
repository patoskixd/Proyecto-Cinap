import CreateSlotsWizard from "@/presentation/components/advisor/slots/CreateSlotsWizard";
import { GetCreateSlotsData } from "@application/slots/usecases/GetCreateSlotsData";
import { InMemorySlotsRepo } from "@infrastructure/slots/InMemorySlotsRepo";

export default async function OpenSlotsPage() {
  const repo = new InMemorySlotsRepo();
  const data = await new GetCreateSlotsData(repo).exec(); // { categories, servicesByCategory, times }

  return (
    <main className="bg-[linear-gradient(135deg,#f8fafc_0%,#e2e8f0_100%)]">
      <div className="mx-auto max-w-[1200px] px-4 py-6 md:py-8">
      
        <CreateSlotsWizard
          categories={data.categories}
          servicesByCategory={data.servicesByCategory}
          times={data.times}
        />
      </div>
    </main>
  );
}
