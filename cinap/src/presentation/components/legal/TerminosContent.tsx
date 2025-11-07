"use client";

// Componente que muestra el contenido de Términos y Condiciones
// Se utiliza en la página /terminos
// Describe las condiciones de uso de la plataforma CINAP
export default function TerminosContent() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
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
          <h1 className="text-5xl font-bold text-gray-900 mb-3">
            Términos y Condiciones de Uso
          </h1>
          <p className="text-gray-600">
            Plataforma de Asesorías del Centro de Innovación y Apoyo Pedagógico (CINAP) – Universidad Católica de Temuco
          </p>
          <p className="text-gray-500 mt-2 text-sm">Última actualización: 5 de noviembre de 2025</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="space-y-6">

          {/* 1. Aceptación */}
          <Section n="1" title="Aceptación del Acuerdo">
            <p>
              Al acceder o utilizar la plataforma de asesorías del <strong>CINAP</strong>, usted declara haber leído y aceptado íntegramente estos Términos y Condiciones (el “Acuerdo”). Si no está de acuerdo, debe abstenerse de usar el servicio.
            </p>
            <p className="mt-3 text-sm text-gray-600">
              Este Acuerdo rige el uso del sitio y servicios relacionados para la gestión de asesorías entre docentes y asesores del CINAP.
            </p>
          </Section>

          {/* 2. Definiciones */}
          <Section n="2" title="Definiciones">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Plataforma</strong>: Sistema web de CINAP para reserva, confirmación y cancelación de asesorías académicas.</li>
              <li><strong>Usuario</strong>: Persona con credenciales válidas (p.ej., docente/asesor) que accede a la Plataforma.</li>
              <li><strong>Asesoría</strong>: Reunión académica gestionada a través de la Plataforma.</li>
              <li><strong>Servicios Externos</strong>: Integraciones de terceros, como Google OAuth y Google Calendar.</li>
            </ul>
          </Section>

          {/* 3. Registro y Elegibilidad */}
          <Section n="3" title="Registro y Elegibilidad">
            <p>
              El acceso requiere autenticación mediante cuenta válida y autorizada por la UCT. Usted es responsable de la veracidad de los datos provistos, de mantener la confidencialidad de sus credenciales y de toda actividad realizada bajo su cuenta. Notifique incidentes de seguridad a <a className="text-blue-600 underline" href="mailto:cinap@uct.cl">cinap@uct.cl</a>.
            </p>
          </Section>

          {/* 4. Descripción del Servicio */}
          <Section n="4" title="Descripción del Servicio">
            <p>
              La Plataforma permite: (i) visualizar disponibilidad, (ii) reservar asesorías, (iii) confirmar/cancelar reservas y (iv) recibir notificaciones. <strong>No se encuentra habilitada la modificación directa de asesorías</strong>. Ciertas funciones pueden requerir Servicios Externos.
            </p>
          </Section>

          {/* 5. Uso Permitido y Prohibiciones */}
          <Section n="5" title="Uso Permitido y Prohibiciones">
            <ul className="list-disc pl-6 space-y-2">
              <li>Usar la Plataforma solo para fines académicos e institucionales.</li>
              <li>No intentar vulnerar seguridad, interrumpir el servicio ni acceder a datos de terceros.</li>
              <li>No publicar, cargar o transmitir contenido ilícito, ofensivo o que infrinja derechos de terceros.</li>
              <li>Cumplir las políticas y normativas internas de la UCT aplicables al uso de tecnologías de información.</li>
            </ul>
          </Section>

          {/* 6. Integraciones con Google */}
          <Section n="6" title="Integraciones con Google (OAuth y Calendar)">
            <p>
              Para autenticar y gestionar eventos de agenda, la Plataforma solicita su consentimiento para acceder a datos básicos de perfil y a su calendario, exclusivamente con el fin de agendar/confirmar/cancelar asesorías. El acceso se realiza mediante <strong>Google OAuth</strong> y se limita a los alcances autorizados por usted.
            </p>
          </Section>

          {/* 7. Privacidad y Datos Personales */}
          <Section n="7" title="Privacidad y Protección de Datos Personales">
            <p>
              La información personal tratada por la Plataforma se utiliza con fines académicos y administrativos del CINAP. Se aplican las políticas de privacidad institucionales de la UCT y la normativa chilena aplicable. No se comparten datos con terceros no autorizados.
            </p>
            <p className="mt-3">
              La Plataforma puede registrar datos operativos (p.ej., fecha/hora de reserva, estado de asesorías, métricas técnicas) para asegurar trazabilidad y mejorar el servicio.
            </p>
          </Section>

          {/* 8. Disponibilidad y Soporte */}
          <Section n="8" title="Disponibilidad del Servicio y Soporte">
            <p>
              La Plataforma se ofrece bajo el principio de “mejor esfuerzo”. Puede experimentar indisponibilidad temporal por mantenciones, fallas de infraestructura o servicios externos. No se garantiza un nivel de servicio continuo ni libre de errores.
            </p>
            <p className="mt-3 text-sm text-gray-600">
              Soporte: <a className="text-blue-600 underline" href="mailto:cinap@uct.cl">cinap@uct.cl</a>.
            </p>
          </Section>

          {/* 9. Reservas, Confirmaciones y Cancelaciones */}
          <Section n="9" title="Reservas, Confirmaciones y Cancelaciones">
            <ul className="list-disc pl-6 space-y-2">
              <li>Las reservas dependen de la disponibilidad publicada por los asesores.</li>
              <li>Podrá <strong>confirmar o cancelar</strong> reservas según reglas vigentes. <strong>No está habilitada la modificación</strong> (reprogramación directa) de asesorías.</li>
              <li>La inasistencia reiterada o el uso indebido puede implicar restricciones de uso.</li>
            </ul>
          </Section>

          {/* 10. Propiedad Intelectual */}
          <Section n="10" title="Propiedad Intelectual">
            <p>
              La Plataforma, su diseño, software, documentación y contenidos asociados son propiedad de la Universidad Católica de Temuco y/o sus licenciantes. Se prohíbe su uso no autorizado, reproducción o ingeniería inversa.
            </p>
          </Section>

          {/* 11. Contenido de Usuario y Feedback */}
          <Section n="11" title="Contenido de Usuario y Retroalimentación">
            <p>
              Usted conserva derechos sobre su propio contenido. Al enviar retroalimentación o sugerencias, concede a la UCT una licencia no exclusiva para usarlas a fin de mejorar la Plataforma, sin obligación de reconocimiento o compensación.
            </p>
          </Section>

          {/* 12. Terceros y Enlaces */}
          <Section n="12" title="Servicios de Terceros y Enlaces">
            <p>
              El uso de Servicios Externos (p.ej., Google) se rige por sus propios términos y políticas. La UCT no es responsable por la disponibilidad o el desempeño de tales servicios.
            </p>
          </Section>

          {/* 13. Limitación de Responsabilidad */}
          <Section n="13" title="Limitación de Responsabilidad">
            <p>
              En la medida permitida por la ley, el CINAP y la UCT no serán responsables por daños indirectos, emergentes, pérdida de datos o lucro cesante derivados del uso o imposibilidad de uso de la Plataforma o de Servicios Externos.
            </p>
          </Section>

          {/* 14. Suspensión y Término */}
          <Section n="14" title="Suspensión y Término">
            <p>
              El CINAP puede suspender o terminar su acceso si detecta incumplimientos, riesgos de seguridad o uso indebido. Al término, podrán deshabilitarse las funciones y eliminarse datos operativos conforme a las políticas internas y obligaciones legales aplicables.
            </p>
          </Section>

          {/* 15. Cambios a los Términos */}
          <Section n="15" title="Cambios a estos Términos">
            <p>
              El CINAP puede actualizar estos Términos. Los cambios serán publicados en la Plataforma o en los canales institucionales. El uso continuado implica aceptación de las modificaciones.
            </p>
          </Section>

          {/* 16. Ley Aplicable y Jurisdicción */}
          <Section n="16" title="Ley Aplicable y Jurisdicción">
            <p>
              Este Acuerdo se rige por las leyes de la República de Chile. Toda controversia se someterá a los tribunales competentes de la ciudad de Temuco.
            </p>
          </Section>

          {/* 17. Fuerza Mayor */}
          <Section n="17" title="Fuerza Mayor">
            <p>
              No habrá responsabilidad por incumplimientos debidos a causas fuera del control razonable (p.ej., desastres naturales, fallas de telecomunicaciones, servicios de terceros, medidas de autoridad).
            </p>
          </Section>

          {/* 18. Comunicaciones y Notificaciones */}
          <Section n="18" title="Comunicaciones y Notificaciones">
            <p>
              Consultas y notificaciones: <a className="text-blue-600 underline" href="mailto:cinap@uct.cl">cinap@uct.cl</a>. La UCT podrá comunicar novedades relevantes mediante correo institucional o avisos en la Plataforma.
            </p>
          </Section>

          {/* 19. Disposiciones Finales */}
          <Section n="19" title="Disposiciones Finales">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Integridad:</strong> Este Acuerdo constituye el entendimiento completo respecto del uso de la Plataforma.</li>
              <li><strong>Divisibilidad:</strong> Si alguna cláusula se declara inválida, el resto permanecerá vigente.</li>
              <li><strong>Cesión:</strong> Usted no puede ceder derechos/obligaciones sin autorización previa de la UCT.</li>
              <li><strong>No Renuncia:</strong> La no exigencia de un derecho no implica renuncia futura.</li>
            </ul>
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
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
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
