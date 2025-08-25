import RegisterAdvisorHeader from "@/presentation/components/admin/register-advisor/RegisterAdvisorHeader";
import RegisterAdvisorForm from "@/presentation/components/admin/register-advisor/RegisterAdvisorForm";

export default function RegistrarAsesorPage() {
  return (
    <main className="bg-[linear-gradient(135deg,#f8fafc_0%,#e2e8f0_100%)]">
      <div className="bg-gradient-to-b from-slate-50 to-slate-100">
        <RegisterAdvisorHeader />
        <RegisterAdvisorForm />
      </div>
    </main>
  );
}
