import ManageTeachersView from "@presentation/components/admin/manage-teacher/ManageTeachersView";

export default function Page() {
  return (
    <main className="bg-[linear-gradient(135deg,#f8fafc_0%,#e2e8f0_100%)]">
      <div className="bg-gradient-to-b from-slate-50/60 to-slate-100/60">
        <ManageTeachersView />
      </div>
    </main>
  );
}
