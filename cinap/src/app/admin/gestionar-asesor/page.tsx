import ManageAdvisorsView from "@presentation/components/admin/manage-advisor/ManageAdvisorsView";

export default function GestionarAsesoresPage() {
  return (
    <main className="bg-[linear-gradient(135deg,#f8fafc_0%,#e2e8f0_100%)]">
      <div className="mx-auto max-w-[1100px] space-y-6 px-4 py-6 sm:px-6">
        <ManageAdvisorsView />
      </div>
    </main>
  );
}
