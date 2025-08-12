import Link from "next/link";
export default function Home() {
  return (
    <>
      {/* Hero */}
      <section
        id="inicio"
        className="relative flex min-h-screen items-center overflow-hidden bg-[linear-gradient(135deg,#f8fafc_0%,#e2e8f0_100%)] pt-[72px]"
      >
        {/* Floating shapes (aprox sin keyframes custom) */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[10%] top-[20%] h-[200px] w-[200px] rounded-full bg-blue-600/10 blur-[1px] animate-bounce" />
          <div className="absolute right-[15%] top-[60%] h-[150px] w-[150px] rounded-full bg-emerald-500/10 blur-[1px] animate-bounce [animation-delay:200ms]" />
          <div className="absolute bottom-[20%] left-[20%] h-[100px] w-[100px] rounded-full bg-amber-500/10 blur-[1px] animate-bounce [animation-delay:400ms]" />
        </div>

        <div className="relative z-10 mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-8 px-6 md:grid-cols-2 md:gap-16">
          {/* Copy */}
          <div>
            <div className="mb-6 inline-flex items-center rounded-full border border-blue-600/20 bg-blue-600/10 px-4 py-2 text-sm font-semibold text-blue-600">
              🤖 Inteligencia Artificial
            </div>

            <h1 className="text-balance text-4xl font-extrabold leading-tight text-neutral-900 sm:text-5xl">
              Asesorías Programadas{" "}
              <span className="bg-gradient-to-br from-blue-600 to-emerald-500 bg-clip-text text-transparent">
                Inteligentes
              </span>
            </h1>

            <p className="mt-3 text-base font-semibold uppercase tracking-wide text-blue-600">
              Reserva un espacio de asesoría personal con el CINAP
            </p>

            <p className="mt-4 max-w-xl text-lg leading-7 text-neutral-600">
              Nuestra inteligencia artificial revoluciona la gestión de asesorías académicas,
              permitiendo a los docentes solicitar, modificar y cancelar citas de manera
              eficiente y automatizada.
            </p>

            <div className="mt-6 flex flex-col items-start gap-3 sm:flex-row">
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 px-6 py-3 text-lg font-semibold text-white shadow-[0_8px_25px_rgba(37,99,235,0.3)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_35px_rgba(37,99,235,0.4)]"
              >
                <span>Comenzar Ahora</span>
                <div>→</div>
              </Link>

              <a
                href="#servicios"
                className="inline-flex items-center gap-2 rounded-full border-2 border-neutral-200 px-6 py-3 text-lg font-semibold text-neutral-600 transition-all hover:-translate-y-0.5 hover:border-blue-600 hover:text-blue-600"
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] leading-none text-white">
                  ▶
                </div>
                <span>Ver Demo</span>
              </a>
            </div>
          </div>

          {/* Visual */}
          <div className="flex items-center justify-center">
            <div className="relative transition-transform [transform:perspective(1000px)_rotateY(-15deg)_rotateX(5deg)] hover:[transform:perspective(1000px)_rotateY(-10deg)_rotateX(2deg)]">
              <div className="h-[500px] w-[350px] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_25px_50px_rgba(0,0,0,0.15)] md:h-[500px] md:w-[350px]">
                <div className="flex items-center border-b border-neutral-200 bg-neutral-50 px-4 py-4">
                  <div className="flex gap-2">
                    <span className="h-3 w-3 rounded-full bg-red-500" />
                    <span className="h-3 w-3 rounded-full bg-amber-500" />
                    <span className="h-3 w-3 rounded-full bg-emerald-500" />
                  </div>
                </div>

                <div className="flex h-[calc(100%-64px)] flex-col gap-3 p-6">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-xl">🤖</div>
                    <div className="max-w-[80%] rounded-2xl bg-blue-600 px-3 py-2 text-sm text-white">
                      ¡Hola! ¿En qué puedo ayudarte con tus asesorías?
                    </div>
                  </div>

                  <div className="flex flex-row-reverse items-start gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-xl">👨‍🏫</div>
                    <div className="max-w-[80%] rounded-2xl bg-neutral-100 px-3 py-2 text-sm text-neutral-800">
                      Necesito programar una asesoría para mañana
                    </div>
                  </div>

                  <div className="ml-12 inline-flex items-center gap-1 rounded-2xl bg-neutral-100 px-3 py-2">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neutral-400" />
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neutral-400 [animation-delay:200ms]" />
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neutral-400 [animation-delay:400ms]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="servicios" className="bg-white px-6 py-24">
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold text-neutral-900 sm:text-4xl">
              Funcionalidades Principales
            </h2>
            <p className="mx-auto mt-3 max-w-[600px] text-lg text-neutral-600">
              Gestiona tus asesorías de manera inteligente y eficiente
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Card 1 */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-10 text-center shadow-[0_10px_30px_rgba(0,0,0,0.1)] transition-transform hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)]">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 to-emerald-500" />
              <div className="mx-auto mb-6 inline-block rounded-2xl bg-blue-600/10 p-4 text-4xl">📅</div>
              <h3 className="text-xl font-semibold text-neutral-900">Solicitar Horas</h3>
              <p className="mt-3 text-neutral-600">
                Programa nuevas asesorías con disponibilidad en tiempo real y confirmación automática
              </p>
              <div className="mt-4 inline-block rounded-full bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-1 text-sm font-semibold text-white">
                Disponible 24/7
              </div>
            </div>

            {/* Card 2 */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-10 text-center shadow-[0_10px_30px_rgba(0,0,0,0.1)] transition-transform hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)]">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 to-emerald-500" />
              <div className="mx-auto mb-6 inline-block rounded-2xl bg-blue-600/10 p-4 text-4xl">✏️</div>
              <h3 className="text-xl font-semibold text-neutral-900">Modificar Citas</h3>
              <p className="mt-3 text-neutral-600">
                Cambia horarios, fechas o detalles de tus asesorías con notificaciones automáticas
              </p>
              <div className="mt-4 inline-block rounded-full bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-1 text-sm font-semibold text-white">
                Flexibilidad Total
              </div>
            </div>

            {/* Card 3 */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-10 text-center shadow-[0_10px_30px_rgba(0,0,0,0.1)] transition-transform hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)]">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 to-emerald-500" />
              <div className="mx-auto mb-6 inline-block rounded-2xl bg-blue-600/10 p-4 text-4xl">❌</div>
              <h3 className="text-xl font-semibold text-neutral-900">Cancelar Reservas</h3>
              <p className="mt-3 text-neutral-600">
                Cancela asesorías con anticipación y libera espacios para otros docentes automáticamente
              </p>
              <div className="mt-4 inline-block rounded-full bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-1 text-sm font-semibold text-white">
                Sin Complicaciones
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
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

      {/* CTA */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-700 px-6 py-24 text-center text-white">
        <div className="mx-auto max-w-[800px]">
          <h2 className="text-balance text-3xl font-bold sm:text-4xl">¿Listo para optimizar tus asesorías?</h2>
          <p className="mx-auto mt-4 max-w-[700px] text-lg opacity-90">
            Únete a cientos de docentes que ya confían en nuestra IA para gestionar sus asesorías de manera eficiente
          </p>

          <Link
            href="/auth/login"
            className="mt-10 inline-flex items-center gap-3 rounded-full bg-white px-8 py-4 text-lg font-bold text-blue-600 shadow-[0_10px_30px_rgba(0,0,0,0.2)] transition-all hover:-translate-y-0.5 hover:shadow-[0_15px_40px_rgba(0,0,0,0.3)]"
          >
            <span>Comenzar Gratis</span>
            <div className="text-xl">🚀</div>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900 px-6 py-12 text-white">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-3">
            <div className="text-2xl leading-none text-blue-600">🎓</div>
            <span className="text-lg font-bold text-blue-600">CINAP</span>
            <p className="ml-3 text-sm text-neutral-400">Centro de Innovación Académica y Pedagógica</p>
          </div>

          <div className="flex gap-6">
            <a href="#" className="text-sm text-neutral-400 transition-colors hover:text-blue-600">
              Términos
            </a>
            <a href="#" className="text-sm text-neutral-400 transition-colors hover:text-blue-600">
              Privacidad
            </a>
            <a href="#" className="text-sm text-neutral-400 transition-colors hover:text-blue-600">
              Soporte
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
