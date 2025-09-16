export function HeaderCard() {
  return (
    <section className="rounded-2xl bg-white p-6 md:p-8 shadow-[0_10px_30px_rgba(0,0,0,0.06)] ring-1 ring-slate-100">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-neutral-900">Solicitudes por Confirmar</h1>
        <p className="text-neutral-600">
          Revisa las solicitudes pendientes que requieren confirmación por correo de Google.
        </p>
      </div>
    </section>
  );
}
