import ManageTeachersView from "@presentation/components/admin/manage-teacher/ManageTeachersView";
import ToastProvider from "@presentation/components/shared/Toast/ToastProvider";

export default function Page() {
  return (
    <ToastProvider>
      <main className="bg-[linear-gradient(135deg,#f8fafc_0%,#e2e8f0_100%)]">
        <div className="mx-auto max-w-[1200px] px-4 py-6 md:py-8">
          <ManageTeachersView />
        </div>
      </main>
    </ToastProvider>
  );
}
