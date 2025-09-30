"use client";

export default function RegisterAdvisorHeader() {
  return (
    <section className="mx-auto mt-6 md:mt-8 max-w-[1100px]">
      <div className="mb-6 rounded-2xl border border-blue-200 bg-gradient-to-br from-white via-blue-50/30 to-yellow-50/20 p-6 shadow-lg backdrop-blur-sm md:mb-8 md:p-8">
        <div>
          <h1 className="text-3xl font-bold text-blue-900">Registrar asesor</h1>
          <p className="mt-1 text-blue-700">
            Completa los datos del asesor y selecciona sus categorías y servicios.
          </p>
        </div>
      </div>
    </section>
  );
}
