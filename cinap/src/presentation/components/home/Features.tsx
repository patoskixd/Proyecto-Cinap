// Componente que muestra las funcionalidades principales de la aplicación
// Presenta tres cards con iconos, títulos y descripciones de cada funcionalidad
// Se usa en la página principal para destacar las características clave del sistema
export default function Features() {
    return (
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
              <div className="mx-auto mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/10">
                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
              </div>
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
              <div className="mx-auto mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/10">
                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
              </div>
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
              <div className="mx-auto mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/10">
                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </div>
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
    );
}