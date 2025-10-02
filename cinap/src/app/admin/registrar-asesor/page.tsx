import RegisterAdvisorHeader from "@/presentation/components/admin/register-advisor/RegisterAdvisorHeader";
import RegisterAdvisorForm from "@/presentation/components/admin/register-advisor/RegisterAdvisorForm";

export default function RegistrarAsesorPage() {
  return (
    <main className="bg-gray-50">
      <div className="mx-auto max-w-[1200px] px-4 py-6 md:py-8">
        <RegisterAdvisorHeader />
        <RegisterAdvisorForm />
      </div>
    </main>
  );
}
