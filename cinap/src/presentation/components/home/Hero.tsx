import Link from "next/link";
// Componente que muestra la sección hero en la página principal
// Incluye título, descripción y botones de llamada a la acción
// Se usa en la página principal  para captar la atención de los usuarios
export default function Hero() {
    return (
        <section
        id="inicio"
        className="relative flex min-h-screen items-center overflow-hidden bg-[linear-gradient(135deg,#f8fafc_0%,#e2e8f0_100%)] pt-[72px]"
      >
        {/* Fondos Animados */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[10%] top-[20%] h-[200px] w-[200px] rounded-full bg-blue-600/10 blur-[1px] animate-bounce" />
          <div className="absolute right-[15%] top-[60%] h-[150px] w-[150px] rounded-full bg-emerald-500/10 blur-[1px] animate-bounce [animation-delay:200ms]" />
          <div className="absolute bottom-[20%] left-[20%] h-[100px] w-[100px] rounded-full bg-amber-500/10 blur-[1px] animate-bounce [animation-delay:400ms]" />
        </div>
        {/* Contenido */}
        <div className="relative z-10 mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-8 px-6 md:grid-cols-2 md:gap-16">
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
    );
} 