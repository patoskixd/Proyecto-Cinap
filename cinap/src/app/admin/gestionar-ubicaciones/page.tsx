import ManageLocations from "@/presentation/components/admin/manage-location/ManageLocations";

export default function Page() {
  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#f8fafc_0%,#e2e8f0_100%)]">
      <div className="mx-auto max-w-[1200px] px-4 py-6 md:py-8">
        <ManageLocations />
      </div>
    </main>
  );
}
