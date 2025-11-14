import RegisterAdvisorHeader from "@/presentation/components/admin/register-advisor/RegisterAdvisorHeader";
import RegisterAdvisorForm from "@/presentation/components/admin/register-advisor/RegisterAdvisorForm";
import { ToastProvider } from "@/presentation/components/shared/Toast";

export default function RegistrarAsesorPage() {
  return (
    <main className="bg-gray-50">
      <ToastProvider>
        <div className="mx-auto max-w-[1200px] px-4 py-6 md:py-8">
          <RegisterAdvisorHeader />
          <RegisterAdvisorForm />
        </div>
      </ToastProvider>
    </main>
  );
}
