"use client";

export default function RegisterAdvisorHeader() {
  return (
    <section className="mx-auto mt-6 md:mt-8 max-w-[1100px]">
      <div className="mb-6 rounded-2xl border border-blue-100/50 bg-white/80 p-6 shadow-lg backdrop-blur-sm ring-1 ring-blue-100/50 md:mb-8 md:p-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Registrar asesor</h1>
          <p className="mt-1 text-gray-600">
            Completa los datos del asesor y selecciona sus categorías y servicios.
          </p>
        </div>
      </div>
    </section>
  );
}
