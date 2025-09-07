import CreateSlotsWizard from "@/presentation/components/advisor/slots/CreateSlotsWizard/index";


export default function OpenSlotsPage() {
  return (
    <main className="bg-[linear-gradient(135deg,#f8fafc_0%,#e2e8f0_100%)]">
      <div className="mx-auto max-w-[1200px] px-4 py-6 md:py-8">
        <CreateSlotsWizard /> 
      </div>
    </main>
  );
}
