"use client";

export default function Header() {
  return (
    <section className="rounded-2xl bg-white p-6 md:p-8 shadow-[0_10px_30px_rgba(0,0,0,0.06)] ring-1 ring-slate-100">
      <h1 className="text-3xl font-bold text-neutral-900">Abrir cupos</h1>
      <p className="mt-1 text-neutral-600">
        Configura los cupos que estarán disponibles para los estudiantes.
      </p>
    </section>
  );
}
