export default function Benefits() {
    return (
        <section id="contacto" className="bg-[linear-gradient(135deg,#f8fafc_0%,#e2e8f0_100%)] px-6 py-24">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold text-neutral-900 sm:text-4xl">
              ¿Por qué elegir nuestro sistema de IA?
            </h2>

            <div className="mt-8 flex flex-col gap-4">
              {[
                { icon: "⚡", title: "Respuesta Instantánea", desc: "Confirmaciones y cambios procesados al instante" },
                { icon: "🎯", title: "Precisión Inteligente", desc: "Evita conflictos de horarios automáticamente" },
                { icon: "📊", title: "Análisis Avanzado", desc: "Estadísticas y reportes de uso personalizados" },
                { icon: "🔒", title: "Seguridad Garantizada", desc: "Protección de datos y privacidad total" },
              ].map((b) => (
                <div
                  key={b.title}
                  className="flex items-start gap-4 rounded-xl bg-white p-6 shadow-[0_5px_15px_rgba(0,0,0,0.08)] transition-transform hover:translate-x-2"
                >
                  <div className="flex items-center justify-center rounded-lg bg-blue-600/10 p-3 text-2xl">
                    {b.icon}
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-neutral-900">{b.title}</h4>
                    <p className="text-neutral-600">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="grid grid-cols-3 gap-6 rounded-3xl bg-white p-10 text-center shadow-[0_20px_40px_rgba(0,0,0,0.1)]">
              <div>
                <div className="text-4xl font-extrabold text-blue-600">98%</div>
                <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">Satisfacción</div>
              </div>
              <div>
                <div className="text-4xl font-extrabold text-blue-600">24/7</div>
                <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">Disponibilidad</div>
              </div>
              <div>
                <div className="text-4xl font-extrabold text-blue-600">500+</div>
                <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">Docentes</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
}
