import ManageCategories from "@/presentation/components/advisor/categories/ManageCategories";

export const metadata = { title: "Gestionar Categorías y Servicios - CINAP" };

export default function ManageCategoriesPage() {
  return (
    <main className="bg-[linear-gradient(135deg,#f8fafc_0%,#e2e8f0_100%)]">
      <div className="mx-auto max-w-[1200px] px-4 py-6 md:py-8">
        <ManageCategories />
      </div>
    </main>
  );
}
