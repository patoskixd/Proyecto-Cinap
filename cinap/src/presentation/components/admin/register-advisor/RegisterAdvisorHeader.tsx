"use client";

export default function RegisterAdvisorHeader() {
  return (
    <section className="mx-auto mt-6 md:mt-8 max-w-[1100px]">
      <div className="rounded-2xl bg-white p-6 md:p-8 shadow-[0_10px_30px_rgba(0,0,0,0.06)] ring-1 ring-slate-100">
        <h1 className="text-3xl font-bold text-neutral-900">Registrar asesor</h1>
        <p className="mt-1 text-neutral-600">
          Completa los datos del asesor y selecciona sus categorías y servicios.
        </p>
      </div>
    </section>
  );
}
