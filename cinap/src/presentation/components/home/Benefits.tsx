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
                { 
                  icon: <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>, 
                  title: "Respuesta Instantánea", 
                  desc: "Confirmaciones y cambios procesados al instante" 
                },
                { 
                  icon: <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>, 
                  title: "Precisión Inteligente", 
                  desc: "Evita conflictos de horarios automáticamente" 
                },
                { 
                  icon: <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>, 
                  title: "Análisis Avanzado", 
                  desc: "Estadísticas y reportes de uso personalizados" 
                },
                { 
                  icon: <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>, 
                  title: "Seguridad Garantizada", 
                  desc: "Protección de datos y privacidad total" 
                },
              ].map((b) => (
                <div
                  key={b.title}
                  className="flex items-start gap-4 rounded-xl bg-white p-6 shadow-[0_5px_15px_rgba(0,0,0,0.08)] transition-transform hover:translate-x-2"
                >
                  <div className="flex items-center justify-center rounded-lg bg-blue-600/10 p-3">
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
