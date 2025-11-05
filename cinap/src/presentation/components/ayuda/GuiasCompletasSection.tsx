"use client";

import { useState } from "react";

// Componente de guías completas organizadas por rol
// Proporciona documentación detallada para Profesores, Asesores y Administradores
// Optimizado para accesibilidad (ARIA labels) y SEO
export default function GuiasCompletasSection() {
  const [activeRole, setActiveRole] = useState<"profesor" | "asesor" | "admin">("profesor");

  const roles = [
    { id: "profesor" as const, name: "Profesor", icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 14l9-5-9-5-9 5 9 5z"></path>
        <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"></path>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"></path>
      </svg>
    )},
    { id: "asesor" as const, name: "Asesor", icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
      </svg>
    )},
    { id: "admin" as const, name: "Administrador", icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
      </svg>
    )}
  ];

  const guias = {
    profesor: [
      {
        title: "Inicio de Sesión y Primer Acceso",
        steps: [
          "Ingresa a la plataforma CINAP con tu correo institucional (@uct.cl)",
          "Haz clic en Iniciar Sesión con Google para autenticarte",
          "En tu primer acceso, completa tu perfil con información académica",
          "Acepta los términos y condiciones del servicio",
          "Explora el dashboard y familiarízate con las opciones disponibles",
        ],
      },
      {
        title: "Solicitar una Asesoría Pedagógica",
        steps: [
          "En el dashboard, haz clic en Nueva Asesoría o usa el asistente IA",
          "Selecciona el área de asesoría: metodologías, evaluación, TIC, etc.",
          "Elige el asesor de tu preferencia o deja que el sistema recomiende",
          "Selecciona fecha y horario entre las opciones disponibles",
          "Indica la modalidad: presencial u online (mediante videoconferencia)",
          "Agrega una descripción breve de lo que necesitas trabajar",
          "Confirma la reserva y recibirás correo de confirmación",
        ],
      },
      {
        title: "Gestionar tus Asesorías",
        steps: [
          "Ve a Mis Asesorías para ver todas tus reservas activas",
          "Para modificar: selecciona la asesoría y haz clic en Modificar",
          "Elige nueva fecha/hora y confirma el cambio (con 24h de anticipación)",
          "Para cancelar: selecciona y haz clic en Cancelar, indica el motivo",
          "Recibirás notificación de confirmación por correo y Telegram (si vinculado)",
          "Revisa el historial para consultar asesorías pasadas y materiales compartidos",
        ],
      },
      {
        title: "Usar el Asistente de IA",
        steps: [
          "Haz clic en el ícono del chat flotante en la esquina inferior derecha",
          "Escribe tu solicitud en lenguaje natural: Necesito una asesoría de evaluación",
          "El asistente te mostrará opciones de asesores y horarios disponibles",
          "Responde a las preguntas del asistente para refinar tu búsqueda",
          "Confirma la reserva directamente desde el chat",
          "También puedes preguntar: ¿Cuándo es mi próxima asesoría?",
        ],
      },
      {
        title: "Vincular Telegram para Notificaciones",
        steps: [
          "Ve a tu perfil haciendo clic en tu nombre (esquina superior derecha)",
          "En la sección Notificaciones, haz clic en Vincular Telegram",
          "Se generará un código único de 6 dígitos",
          "Abre Telegram y busca el bot @CINAPBot_UCT",
          "Inicia conversación con el bot enviando /start",
          "Envía tu código de vinculación al bot",
          "Recibirás confirmación y notificaciones instantáneas desde ese momento",
        ],
      },
    ],
    asesor: [
      {
        title: "Configurar tu Perfil de Asesor",
        steps: [
          "Accede con tu cuenta institucional y completa tu perfil de asesor",
          "Especifica tus áreas de especialización y expertise",
          "Agrega una breve biografía profesional (visible para profesores)",
          "Configura tu foto de perfil y datos de contacto",
          "Define tus preferencias de modalidad: presencial, online o híbrido",
        ],
      },
      {
        title: "Gestionar tu Disponibilidad",
        steps: [
          "Ve a Disponibilidad en tu panel de asesor",
          "Define tus bloques horarios semanales disponibles",
          "Marca excepciones: días festivos, vacaciones o ausencias",
          "Establece tiempo de preparación entre asesorías (buffer)",
          "Guarda los cambios y el sistema actualizará automáticamente",
          "Los profesores solo verán horarios que hayas marcado como disponibles",
        ],
      },
      {
        title: "Atender Solicitudes de Asesoría",
        steps: [
          "Recibirás notificación cuando un profesor solicite asesoría contigo",
          "Revisa los detalles de la solicitud: tema, modalidad, horario",
          "Acepta la solicitud si todo está correcto",
          "Si necesitas cambios, contacta al profesor para coordinar",
          "Prepara materiales según el tema solicitado",
          "Conéctate 5 minutos antes si es online, llega puntual si es presencial",
        ],
      },
      {
        title: "Realizar y Documentar Asesorías",
        steps: [
          "Conéctate a través del link proporcionado (modalidad online)",
          "Saluda y confirma objetivos de la sesión con el profesor",
          "Desarrolla la asesoría según metodología acordada",
          "Comparte materiales, recursos o documentos de apoyo",
          "Al finalizar, registra resumen y acuerdos en el sistema",
          "Marca la asesoría como completada y adjunta materiales si corresponde",
        ],
      },
      {
        title: "Acceder a Reportes y Estadísticas",
        steps: [
          "Ve a Reportes en tu panel de asesor",
          "Consulta número de asesorías realizadas por período",
          "Revisa evaluaciones y feedback de los profesores",
          "Analiza las áreas más solicitadas y tendencias",
          "Exporta reportes en PDF o Excel para documentación",
          "Usa esta información para mejorar continuamente tu servicio",
        ],
      },
    ],
    admin: [
      {
        title: "Acceder al Panel Administrativo",
        steps: [
          "Inicia sesión con tu cuenta de administrador",
          "Ve a Panel de Administración en el menú principal",
          "Familiarízate con las diferentes secciones: usuarios, asesores, configuración",
          "Revisa el dashboard con métricas generales del sistema",
          "Configura preferencias de visualización según tus necesidades",
        ],
      },
      {
        title: "Gestionar Usuarios (Profesores)",
        steps: [
          "Ve a Usuarios > Profesores",
          "Revisa la lista completa de profesores registrados",
          "Usa filtros para buscar por facultad, carrera o estado",
          "Activa/desactiva cuentas según sea necesario",
          "Edita información de perfil si el usuario solicita soporte",
          "Exporta listados para análisis o reportes institucionales",
        ],
      },
      {
        title: "Administrar Asesores",
        steps: [
          "Ve a Usuarios > Asesores",
          "Agrega nuevos asesores completando el formulario",
          "Asigna áreas de especialización a cada asesor",
          "Configura permisos y niveles de acceso",
          "Revisa métricas de desempeño: asesorías completadas, calificaciones",
          "Desactiva asesores que ya no estén disponibles",
        ],
      },
      {
        title: "Supervisar Asesorías",
        steps: [
          "Ve a Asesorías > Todas las asesorías",
          "Revisa estado: programadas, completadas, canceladas",
          "Filtra por fecha, asesor, profesor o tipo de asesoría",
          "Intervén en caso de conflictos o problemas reportados",
          "Verifica que las asesorías se estén completando según lo programado",
          "Contacta a usuarios en caso de incidencias o patrones inusuales",
        ],
      },
      {
        title: "Configurar el Sistema",
        steps: [
          "Ve a Configuración > Parámetros del sistema",
          "Ajusta horarios de operación de la plataforma",
          "Configura tipos de asesorías disponibles",
          "Establece tiempos mínimos de anticipación para reservas/cancelaciones",
          "Personaliza plantillas de correos y notificaciones",
          "Guarda cambios y prueba funcionalidad antes de aplicar en producción",
        ],
      },
      {
        title: "Generar Reportes y Análisis",
        steps: [
          "Ve a Reportes > Análisis",
          "Selecciona período: semanal, mensual, semestral o personalizado",
          "Revisa métricas clave: total asesorías, tasas de cancelación, satisfacción",
          "Analiza tendencias por facultad, tipo de asesoría o asesor",
          "Genera gráficos y visualizaciones para presentaciones",
          "Exporta reportes en diferentes formatos para la dirección",
        ],
      },
    ],
  };

  return (
    <section id="guias-completas" className="mb-16 scroll-mt-24">
      <div className="mb-8 text-center">
        <h2 className="mb-3 text-3xl font-bold text-gray-900">Guías Completas por Rol</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Documentación detallada según tu rol en la plataforma
        </p>
      </div>

      {/* Role Tabs */}
      <div className="flex flex-wrap justify-center gap-3 mb-8">
        {roles.map((role) => (
          <button
            key={role.id}
            onClick={() => setActiveRole(role.id)}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200
              ${activeRole === role.id 
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30' 
                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300 hover:text-blue-600'}
            `}
          >
            <div className={`w-5 h-5 ${activeRole === role.id ? 'text-white' : 'text-gray-500'}`}>
              {role.icon}
            </div>
            {role.name}
          </button>
        ))}
      </div>

      {/* Guides Content */}
      <div className="space-y-5">
        {guias[activeRole].map((guia, index) => (
          <article
            key={index}
            className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-200"
          >
            <div className="flex gap-5">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                  {index + 1}
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-4 mt-1">{guia.title}</h3>
                <ol className="space-y-3">
                  {guia.steps.map((step, stepIndex) => (
                    <li key={stepIndex} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center mt-0.5">
                        {stepIndex + 1}
                      </span>
                      <span className="text-gray-700 leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
