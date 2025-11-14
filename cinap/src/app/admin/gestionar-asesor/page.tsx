import ManageAdvisorsView from "@presentation/components/admin/manage-advisor/ManageAdvisorsView";
import { ToastProvider } from "@presentation/components/shared/Toast";

export default function GestionarAsesoresPage() {
  return (
    <main className="bg-[linear-gradient(135deg,#f8fafc_0%,#e2e8f0_100%)]">
      <ToastProvider>
        <div className="mx-auto max-w-[1200px] px-4 py-6 md:py-8">
          <ManageAdvisorsView />
        </div>
      </ToastProvider>
    </main>
  );
}
