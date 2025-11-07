"use client";

// Componente que muestra el contenido de Política de Privacidad
// Se utiliza en la página /privacidad
// Describe cómo se recopilan, usan y protegen los datos personales en CINAP
export default function PrivacidadContent() {
  const dataCategories = [
    {
      title: "Datos de Identificación",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      ),
      items: ["Nombre y apellidos", "Correo electrónico institucional"],
    },
    {
      title: "Datos Académicos",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
          <polyline points="22,6 12,13 2,6"></polyline>
        </svg>
      ),
      items: ["Rol (docente/asesor/estudiante)", "Unidad académica (cuando aplique)"],
    },
    {
      title: "Datos de Uso",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      ),
      items: ["Historial de reservas/confirmaciones/cancelaciones", "Preferencias de asesorías (p. ej., franja horaria)"],
    },
    {
      title: "Datos Técnicos",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
          <line x1="8" y1="21" x2="16" y2="21"></line>
          <line x1="12" y1="17" x2="12" y2="21"></line>
        </svg>
      ),
      items: ["Dirección IP (en logs de seguridad)", "Tipo de navegador y sistema operativo"],
    },
    {
      title: "Datos de Comunicación",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      ),
      items: ["Mensajes y solicitudes dentro de la plataforma", "Correos de notificación transaccional"],
    },
  ];

  const securityFeatures = [
    {
      title: "Encriptación",
      description: "TLS en tránsito y cifrado en los servicios que lo soportan",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
      ),
    },
    {
      title: "Autenticación",
      description: "Acceso mediante Google OAuth con scopes mínimos necesarios",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        </svg>
      ),
    },
    {
      title: "Monitoreo",
      description: "Registros de auditoría y alertas de actividad inusual",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M12 1v6m0 6v6m5.2-13.2l-4.2 4.2m0 6l4.2 4.2M23 12h-6m-6 0H1m18.2 5.2l-4.2-4.2m0-6l4.2-4.2"></path>
        </svg>
      ),
    },
    {
      title: "Respaldos",
      description: "Backups periódicos con eliminación segura al vencer su retención",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-16 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-3">Política de Privacidad</h1>
          <p className="text-gray-500 mt-1 text-sm">Última actualización: 5 de noviembre de 2025</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="space-y-6">
          {/* 1. Introducción */}
          <Section n="1" title="Introducción">
            <p>
              En el <strong>CINAP</strong> de la Universidad Católica de Temuco, protegemos su privacidad y
              tratamos sus datos personales con fines estrictamente académicos y administrativos. Esta política
              explica qué datos recopilamos, para qué los usamos, con quién los compartimos y qué controles tiene usted.
            </p>
          </Section>

          {/* 2. Información que recopilamos */}
          <Section n="2" title="Información que Recopilamos">
            <p className="mb-5">Recopilamos los siguientes tipos de información, aplicando siempre el principio de minimización:</p>
            <div className="space-y-4">
              {dataCategories.map((category, idx) => (
                <div key={idx} className="bg-gray-50 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-6 h-6 text-emerald-500">{category.icon}</div>
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
          </Section>

          {/* 3. Bases legales */}
          <Section n="3" title="Bases Legales del Tratamiento de Datos">
            <ul className="space-y-3">
              <Li>Consentimiento informado del usuario para autenticación y uso de Google Calendar.</Li>
              <Li>Ejecución de funciones académicas y administrativas propias del CINAP.</Li>
              <Li>Interés legítimo institucional para seguridad, prevención de fraude y mejora operativa.</Li>
              <Li>Cumplimiento de obligaciones legales o requerimientos de autoridad cuando corresponda.</Li>
            </ul>
          </Section>

          {/* 4. Cómo usamos su información */}
          <Section n="4" title="Cómo Usamos su Información">
            <ul className="space-y-3">
              <Li>Gestionar reservas, confirmaciones y cancelaciones de asesorías.</Li>
              <Li>Sincronizar agendas con Google Calendar cuando usted lo autoriza.</Li>
              <Li>Enviar notificaciones transaccionales sobre el estado de sus asesorías.</Li>
              <Li>Mejorar disponibilidad, rendimiento y seguridad de la Plataforma mediante métricas agregadas/anonimizadas.</Li>
              <Li><strong>No</strong> vendemos datos ni realizamos publicidad basada en su información personal.</Li>
              <Li><strong>No</strong> entrenamos modelos de IA con contenidos personales identificables.</Li>
            </ul>
          </Section>

          {/* 5. Integraciones con Google */}
          <Section n="5" title="Integraciones con Google (OAuth y Calendar)">
            <p>
              Para autenticación y gestión de eventos se solicitan los permisos mínimos necesarios (p. ej., perfil, correo y
              acceso al calendario para crear/actualizar/cancelar eventos de asesorías). Usted puede <strong>revocar</strong> los
              permisos en cualquier momento desde la configuración de su cuenta de Google. Al revocar permisos, algunas
              funciones podrían dejar de estar disponibles.
            </p>
          </Section>

          {/* 6. Compartir información */}
          <Section n="6" title="Con Quién Compartimos su Información">
            <p className="mb-4">No compartimos datos con terceros no autorizados. Podremos compartir únicamente cuando:</p>
            <ul className="space-y-3">
              <Li>Sea necesario para operar la Plataforma (p. ej., Google como proveedor de autenticación/calendario).</Li>
              <Li>Sea requerido por ley o autoridad competente, o para proteger derechos institucionales y de los usuarios.</Li>
              <Li>La propia UCT los trate con fines académicos/administrativos y dentro de sus políticas de privacidad.</Li>
            </ul>
          </Section>

          {/* 7. Seguridad */}
          <Section n="7" title="Seguridad de los Datos">
            <p className="mb-6">Aplicamos medidas técnicas y organizativas proporcionales al riesgo:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {securityFeatures.map((feature, idx) => (
                <div key={idx} className="bg-gray-50 rounded-xl p-5 text-center">
                  <div className="w-10 h-10 mx-auto mb-3 text-emerald-500">{feature.icon}</div>
                  <h4 className="text-base font-semibold text-gray-900 mb-2">{feature.title}</h4>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-gray-600">
              El acceso a datos está restringido bajo el principio de mínimo privilegio y autenticación robusta.
            </p>
          </Section>

          {/* 8. Retención y eliminación */}
          <Section n="8" title="Retención y Eliminación de Datos">
            <ul className="space-y-3">
              <Li>Conservamos datos personales durante el tiempo necesario para prestar el servicio y cumplir obligaciones legales.</Li>
              <Li>Registros técnicos y de auditoría se conservan por un periodo limitado para seguridad y diagnóstico.</Li>
              <Li>Al solicitar eliminación o cerrar su cuenta, procederemos al borrado o anonimización, salvo obligación legal de conservación.</Li>
              <Li>Los respaldos siguen ciclos de retención. Al expirar, se eliminan de forma segura.</Li>
            </ul>
          </Section>

          {/* 9. Ubicación y transferencias */}
          <Section n="9" title="Ubicación del Tratamiento de Datos y Transferencias">
            <p>
              El tratamiento de Datos se realiza en infraestructura institucional y/o proveedores contratados por la UCT. Cuando
              resulte necesario operar fuera de Chile, adoptaremos salvaguardas contractuales y de seguridad adecuadas para
              proteger sus datos.
            </p>
          </Section>

          {/* 10. Sus derechos y cómo ejercerlos */}
          <Section n="10" title="Sus Derechos y Cómo Ejercerlos">
            <ul className="space-y-3">
              <Li><strong>Acceso</strong> a los datos personales tratados por la Plataforma.</Li>
              <Li><strong>Rectificación</strong> de datos inexactos o incompletos.</Li>
              <Li><strong>Eliminación</strong> de datos cuando proceda.</Li>
              <Li><strong>Oposición</strong> y <strong>limitación</strong> al tratamiento en casos previstos.</Li>
              <Li><strong>Portabilidad</strong> cuando corresponda.</Li>
            </ul>
            <p className="mt-4">
              Para ejercer sus derechos o realizar consultas, escriba a{" "}
              <a className="text-emerald-700 underline" href="mailto:cinap@uct.cl">cinap@uct.cl</a>.
              También puede revocar los permisos de Google desde su cuenta de Google en cualquier momento.
            </p>
          </Section>

          {/* 11. Cookies */}
          <Section n="11" title="Cookies y Tecnologías Similares">
            <p>
              Utilizamos cookies necesarias para el funcionamiento y, de forma opcional, analíticas agregadas para
              mejorar la experiencia. Puede gestionar sus preferencias desde su navegador. No realizamos publicidad
              personalizada.
            </p>
          </Section>

          {/* 12. Registros y telemetría */}
          <Section n="12" title="Registros y Telemetría">
            <p>
              La Plataforma genera registros técnicos (p. ej., tiempos de respuesta, errores, IP en eventos de seguridad)
              para diagnóstico y mejora del servicio. Estas métricas se usan de forma agregada/anonimizada y se conservan
              por periodos acotados.
            </p>
          </Section>

          {/* 13. Incidentes y notificación */}
          <Section n="13" title="Incidentes de Seguridad">
            <p>
              Ante un incidente que afecte la confidencialidad, integridad o disponibilidad de los datos, activaremos
              nuestros protocolos de respuesta y, cuando corresponda, notificaremos a los afectados y a las autoridades
              conforme a la normativa aplicable.
            </p>
          </Section>

          {/* 14. Cambios a esta política */}
          <Section n="14" title="Cambios a esta Política">
            <p>
              Podemos actualizar esta Política de Privacidad. Publicaremos la versión vigente en la Plataforma
              indicando la fecha de actualización. El uso continuado implica aceptación de los cambios.
            </p>
          </Section>

          {/* 15. Contacto */}
          <Section n="15" title="Contacto">
            <p>
              Dudas o solicitudes: <a className="text-emerald-700 underline" href="mailto:cinap@uct.cl">cinap@uct.cl</a>.
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="flex gap-5">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
            {n}
          </div>
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-1">{title}</h2>
          <div className="text-gray-700 leading-relaxed">{children}</div>
        </div>
      </div>
    </section>
  );
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      <span>{children}</span>
    </li>
  );
}
