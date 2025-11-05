"use client";

// Componente que muestra las guías rápidas de uso
// Incluye instrucciones paso a paso para las funcionalidades principales
// Optimizado para accesibilidad y performance (Lighthouse)
export default function GuiasSection() {
  return (
    <section id="guias-rapidas" className="mb-16 scroll-mt-24">
      <div className="mb-8 text-center">
        <h2 className="mb-3 text-3xl font-bold text-slate-800">Guías Rápidas</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Aprende a usar las funcionalidades principales de CINAP en pocos pasos
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        {/* Guía 1: Reservar Asesoría */}
        <article className="group rounded-2xl bg-white p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="mb-3 text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                Reservar una Asesoría
              </h3>
              <ol className="space-y-2.5 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-semibold flex items-center justify-center mt-0.5">1</span>
                  <span>Inicia sesión con tu correo institucional</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-semibold flex items-center justify-center mt-0.5">2</span>
                  <span>Ve al panel de reservas o usa el asistente de IA</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-semibold flex items-center justify-center mt-0.5">3</span>
                  <span>Selecciona el tipo de asesoría que necesitas</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-semibold flex items-center justify-center mt-0.5">4</span>
                  <span>Elige un asesor y horario disponible</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-semibold flex items-center justify-center mt-0.5">5</span>
                  <span>Confirma tu reserva y recibirás notificación por correo</span>
                </li>
              </ol>
            </div>
          </div>
        </article>

        {/* Guía 2: Modificar o Cancelar */}
        <article className="group rounded-2xl bg-white p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-yellow-200">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center shadow-md">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="mb-3 text-xl font-bold text-slate-800 group-hover:text-yellow-600 transition-colors">
                Modificar o Cancelar
              </h3>
              <ol className="space-y-2.5 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-100 text-yellow-600 text-sm font-semibold flex items-center justify-center mt-0.5">1</span>
                  <span>Accede a tu panel de reservas</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-100 text-yellow-600 text-sm font-semibold flex items-center justify-center mt-0.5">2</span>
                  <span>Busca la asesoría que deseas cambiar</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-100 text-yellow-600 text-sm font-semibold flex items-center justify-center mt-0.5">3</span>
                  <span>Haz clic en &quot;Modificar&quot; o &quot;Cancelar&quot;</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-100 text-yellow-600 text-sm font-semibold flex items-center justify-center mt-0.5">4</span>
                  <span>Si modificas, selecciona nuevo horario</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-100 text-yellow-600 text-sm font-semibold flex items-center justify-center mt-0.5">5</span>
                  <span>Confirma los cambios (hazlo con 24h de anticipación)</span>
                </li>
              </ol>
            </div>
          </div>
        </article>

        {/* Guía 3: Asistente de IA */}
        <article className="group rounded-2xl bg-white p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-emerald-200">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="mb-3 text-xl font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">
                Usar el Asistente de IA
              </h3>
              <ol className="space-y-2.5 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 text-sm font-semibold flex items-center justify-center mt-0.5">1</span>
                  <span>Accede al chat del asistente en tu panel</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 text-sm font-semibold flex items-center justify-center mt-0.5">2</span>
                  <span>Escribe naturalmente lo que necesitas</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 text-sm font-semibold flex items-center justify-center mt-0.5">3</span>
                  <span>Ejemplos: &quot;Quiero reservar una asesoría&quot;, &quot;Cancelar mi reserva del martes&quot;</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 text-sm font-semibold flex items-center justify-center mt-0.5">4</span>
                  <span>Sigue las instrucciones del asistente</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 text-sm font-semibold flex items-center justify-center mt-0.5">5</span>
                  <span>Confirma las acciones sugeridas por el sistema</span>
                </li>
              </ol>
            </div>
          </div>
        </article>

        {/* Guía 4: Vincular Telegram */}
        <article className="group rounded-2xl bg-white p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-purple-200">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-md">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.693-1.653-1.124-2.678-1.799-1.185-.781-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.015-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.009-1.252-.242-1.865-.442-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.333-1.386 4.025-1.627 4.477-1.635.099-.002.321.023.465.141.121.099.155.232.171.326.016.094.036.308.02.475z"/>
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="mb-3 text-xl font-bold text-slate-800 group-hover:text-purple-600 transition-colors">
                Vincular Cuenta de Telegram
              </h3>
              <ol className="space-y-2.5 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-sm font-semibold flex items-center justify-center mt-0.5">1</span>
                  <span>Ve a tu perfil de usuario en CINAP</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-sm font-semibold flex items-center justify-center mt-0.5">2</span>
                  <span>Busca la sección &quot;Vinculación de Telegram&quot;</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-sm font-semibold flex items-center justify-center mt-0.5">3</span>
                  <span>Haz clic en &quot;Vincular cuenta&quot; para generar código</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-sm font-semibold flex items-center justify-center mt-0.5">4</span>
                  <span>Abre Telegram y busca el bot de CINAP</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-sm font-semibold flex items-center justify-center mt-0.5">5</span>
                  <span>Envía tu código y recibe notificaciones instantáneas</span>
                </li>
              </ol>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
