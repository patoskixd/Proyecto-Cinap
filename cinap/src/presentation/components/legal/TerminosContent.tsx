"use client";

// Componente que muestra el contenido de Términos y Condiciones
// Se utiliza en la página /terminos
// Describe las condiciones de uso de la plataforma CINAP
export default function TerminosContent() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-16 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-3">Términos y Condiciones</h1>
        </div>
      </div>

      {/* Content Sections */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="space-y-6">
          {/* Section 1 */}
          <section className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex gap-5">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                  1
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-1">Aceptación de los Términos</h2>
                <p className="text-gray-700 leading-relaxed">
                  Al acceder y utilizar la plataforma CINAP (Centro de Innovación Académica y Pedagógica), 
                  usted acepta estar sujeto a estos términos y condiciones de uso. Si no está de acuerdo 
                  con alguna parte de estos términos, no debe utilizar nuestra plataforma.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex gap-5">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                  2
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-1">Uso del Servicio</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  La plataforma CINAP está diseñada para facilitar la reserva, modificación y cancelación 
                  de asesorías docentes. Los usuarios se comprometen a:
                </p>
                <ul className="space-y-3">
                  {[
                    'Utilizar el servicio de manera responsable y ética',
                    'Proporcionar información veraz y actualizada',
                    'Respetar los horarios de las asesorías reservadas',
                    'Notificar con anticipación en caso de cancelación',
                    'No compartir sus credenciales de acceso con terceros'
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex gap-5">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                  3
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-1">Reservas y Cancelaciones</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Las reservas de asesorías están sujetas a disponibilidad. Los usuarios pueden:
                </p>
                <ul className="space-y-3">
                  {[
                    'Reservar asesorías según la disponibilidad de los asesores',
                    'Modificar sus reservas con al menos 24 horas de anticipación',
                    'Cancelar asesorías notificando con la debida antelación',
                    'Recibir notificaciones sobre confirmaciones y cambios'
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex gap-5">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                  4
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-1">Responsabilidades del Usuario</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Los usuarios son responsables de mantener la confidencialidad de su cuenta y contraseña. 
                  Cualquier actividad realizada bajo su cuenta será de su exclusiva responsabilidad.
                </p>
                <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 flex gap-3">
                  <svg className="w-6 h-6 text-blue-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                  <div className="text-sm text-gray-700">
                    <strong className="text-gray-900">Importante:</strong> Debe notificar inmediatamente a CINAP sobre cualquier uso no autorizado de su cuenta o cualquier otra violación de seguridad.
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex gap-5">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                  5
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-1">Propiedad Intelectual</h2>
                <p className="text-gray-700 leading-relaxed">
                  Todo el contenido de la plataforma CINAP, incluyendo textos, gráficos, logos, iconos, imágenes, 
                  clips de audio, descargas digitales y compilaciones de datos, es propiedad de CINAP o de sus 
                  proveedores de contenido y está protegido por las leyes de propiedad intelectual.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6 */}
          <section className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex gap-5">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                  6
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-1">Limitación de Responsabilidad</h2>
                <p className="text-gray-700 leading-relaxed">
                  CINAP no será responsable de ningún daño directo, indirecto, incidental, especial o consecuente 
                  que resulte del uso o la imposibilidad de usar el servicio, incluso si CINAP ha sido advertido 
                  de la posibilidad de tales daños.
                </p>
              </div>
            </div>
          </section>

          {/* Section 7 */}
          <section className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex gap-5">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                  7
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-1">Modificaciones del Servicio</h2>
                <p className="text-gray-700 leading-relaxed">
                  CINAP se reserva el derecho de modificar o discontinuar, temporal o permanentemente, el servicio 
                  (o cualquier parte del mismo) con o sin previo aviso. CINAP no será responsable ante usted o ante 
                  terceros por cualquier modificación, suspensión o discontinuación del servicio.
                </p>
              </div>
            </div>
          </section>

          {/* Section 8 */}
          <section className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex gap-5">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                  8
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-1">Ley Aplicable</h2>
                <p className="text-gray-700 leading-relaxed">
                  Estos términos y condiciones se regirán e interpretarán de acuerdo con las leyes vigentes, 
                  sin dar efecto a ningún principio de conflictos de leyes.
                </p>
              </div>
            </div>
          </section>

        
        </div>
      </div>
    </div>
  );
}
