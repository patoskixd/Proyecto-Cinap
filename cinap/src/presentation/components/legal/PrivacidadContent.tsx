"use client";

// Componente que muestra el contenido de Política de Privacidad
// Se utiliza en la página /privacidad
// Describe cómo se recopilan, usan y protegen los datos personales en CINAP
export default function PrivacidadContent() {
  const dataCategories = [
    {
      title: 'Datos de Identificación',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      ),
      items: ['Nombre y apellidos', 'Correo electrónico institucional']
    },
    {
      title: 'Datos Académicos',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
          <polyline points="22,6 12,13 2,6"></polyline>
        </svg>
      ),
      items: ['Rol (profesor/estudiante)', 'Carrera y facultad']
    },
    {
      title: 'Datos de Uso',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      ),
      items: ['Historial de reservas', 'Preferencias de asesorías']
    },
    {
      title: 'Datos Técnicos',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
          <line x1="8" y1="21" x2="16" y2="21"></line>
          <line x1="12" y1="17" x2="12" y2="21"></line>
        </svg>
      ),
      items: ['Dirección IP', 'Tipo de navegador y sistema operativo']
    },
    {
      title: 'Datos de Comunicación',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      ),
      items: ['Mensajes de chat con asistente IA', 'Consultas realizadas']
    }
  ];

  const securityFeatures = [
    {
      title: 'Encriptación',
      description: 'Datos encriptados en tránsito y en reposo',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
      )
    },
    {
      title: 'Autenticación',
      description: 'Acceso seguro mediante Google OAuth',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        </svg>
      )
    },
    {
      title: 'Monitoreo',
      description: 'Vigilancia continua de actividades sospechosas',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M12 1v6m0 6v6m5.2-13.2l-4.2 4.2m0 6l4.2 4.2M23 12h-6m-6 0H1m18.2 5.2l-4.2-4.2m0-6l4.2-4.2"></path>
        </svg>
      )
    },
    {
      title: 'Respaldos',
      description: 'Copias de seguridad regulares y seguras',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
        </svg>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-16 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-3">Política de Privacidad</h1>
        </div>
      </div>

      {/* Content Sections */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="space-y-6">
          {/* Section 1 */}
          <section className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex gap-5">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                  1
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-1">Introducción</h2>
                <p className="text-gray-700 leading-relaxed">
                  En CINAP (Centro de Innovación Académica y Pedagógica), nos comprometemos a proteger 
                  su privacidad y garantizar la seguridad de su información personal. Esta política 
                  describe cómo recopilamos, usamos, compartimos y protegemos sus datos personales.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex gap-5">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                  2
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-1">Información que Recopilamos</h2>
                <p className="text-gray-700 leading-relaxed mb-5">
                  Recopilamos diferentes tipos de información para proporcionar y mejorar nuestro servicio:
                </p>
                
                <div className="space-y-4">
                  {dataCategories.map((category, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-xl p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-6 h-6 text-emerald-500">
                          {category.icon}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">{category.title}</h3>
                      </div>
                      <ul className="space-y-2">
                        {category.items.map((item, itemIdx) => (
                          <li key={itemIdx} className="flex items-start gap-2 ml-9">
                            <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            <span className="text-gray-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex gap-5">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                  3
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-1">Cómo Usamos su Información</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Utilizamos la información recopilada para los siguientes propósitos:
                </p>
                <ul className="space-y-3">
                  {[
                    'Gestionar y procesar sus reservas de asesorías',
                    'Comunicarnos con usted sobre sus reservas y actualizaciones del servicio',
                    'Mejorar la experiencia del usuario y personalizar el servicio',
                    'Analizar el uso de la plataforma para optimizar su funcionamiento',
                    'Cumplir con obligaciones legales y reglamentarias',
                    'Entrenar y mejorar nuestros modelos de inteligencia artificial'
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
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                  4
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-1">Compartir Información</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  No vendemos, alquilamos ni compartimos su información personal con terceros, excepto en las siguientes circunstancias:
                </p>
                <div className="bg-amber-50 border-l-4 border-amber-500 rounded-lg p-4 flex gap-3 mb-4">
                  <svg className="w-6 h-6 text-amber-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                  <div className="text-sm text-gray-700">
                    <strong className="text-gray-900">Con su consentimiento:</strong> Compartiremos información cuando usted nos autorice explícitamente.
                  </div>
                </div>
                <ul className="space-y-3">
                  {[
                    'Con proveedores de servicios que nos ayudan a operar la plataforma (Google Calendar, servicios de hosting)',
                    'Cuando sea requerido por ley o para proteger nuestros derechos legales',
                    'Con la institución educativa para fines administrativos y académicos'
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

          {/* Section 5 - Security */}
          <section className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex gap-5">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                  5
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-1">Seguridad de los Datos</h2>
                <p className="text-gray-700 leading-relaxed mb-6">
                  Implementamos medidas de seguridad técnicas y organizativas para proteger su información personal:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {securityFeatures.map((feature, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-xl p-5 text-center">
                      <div className="w-10 h-10 mx-auto mb-3 text-emerald-500">
                        {feature.icon}
                      </div>
                      <h4 className="text-base font-semibold text-gray-900 mb-2">{feature.title}</h4>
                      <p className="text-sm text-gray-600">{feature.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Section 6 */}
          <section className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex gap-5">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                  6
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-1">Sus Derechos</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Usted tiene los siguientes derechos respecto a su información personal:
                </p>
                <ul className="space-y-3">
                  {[
                    { title: 'Acceso', desc: 'Solicitar una copia de los datos personales que tenemos sobre usted' },
                    { title: 'Rectificación', desc: 'Corregir datos inexactos o incompletos' },
                    { title: 'Eliminación', desc: 'Solicitar la eliminación de sus datos personales' },
                    { title: 'Portabilidad', desc: 'Recibir sus datos en un formato estructurado y de uso común' },
                    { title: 'Oposición', desc: 'Oponerse al procesamiento de sus datos personales' }
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      <span className="text-gray-700">
                        <strong className="text-gray-900">{item.title}:</strong> {item.desc}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Section 7 */}
          <section className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex gap-5">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                  7
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-1">Cookies y Tecnologías Similares</h2>
                <p className="text-gray-700 leading-relaxed">
                  Utilizamos cookies y tecnologías similares para mejorar su experiencia en nuestra plataforma. 
                  Las cookies nos ayudan a recordar sus preferencias y entender cómo utiliza nuestro servicio.
                </p>
              </div>
            </div>
          </section>

          {/* Section 8 */}
          <section className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex gap-5">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                  8
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-1">Cambios a esta Política</h2>
                <p className="text-gray-700 leading-relaxed">
                  Podemos actualizar esta Política de Privacidad periódicamente. Le notificaremos sobre cualquier 
                  cambio publicando la nueva política en esta página y actualizando la fecha de &quot;última actualización&quot;.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
