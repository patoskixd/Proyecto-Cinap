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
        title: "Inicio de Sesión y Acceso a la Plataforma",
        steps: [
          "Accede al portal y selecciona la opción “Iniciar sesión con Google”.",
          "Autentícate utilizando tu correo institucional.",
          "Autoriza los permisos solicitados para sincronizar tu cuenta con Google Calendar.",
          "Una vez dentro, se mostrará el Panel Docente.",
        ],
      },
      {
        title: "Vista general del Panel Docente",
        steps: [
          "Al iniciar sesión se muestra el Panel Docente con accesos directos para agendar asesorías y revisar estados.",
          "Los indicadores superiores informan la sincronización con Google Calendar, el total del mes y las solicitudes pendientes por confirmar.",
          "La sección “Próximas Asesorías” muestra tus reservas programadas con su estado y acceso al detalle.",
          "Desde el panel puedes visualizar las asesorías pendientes que requieren confirmación."
        ],
      },
      {
        title: "Agendar una Asesoría",
        steps: [
          "Desde el Panel Docente, haz clic en el botón “Agendar asesoría”.",
          "En el paso Seleccionar, elige la categoría, el servicio y el asesor disponible.",
          "En el paso Agendar, selecciona la fecha y el horario que mejor se adapten a tu disponibilidad.",
          "En el paso Confirmar, revisa el resumen de tu asesoría y confirma la solicitud.",
          "Al confirmar, recibirás un correo electrónico con los detalles y el evento se registrará en Google Calendar una vez confirmado.",
        ],
      },
      {
        title: "Visualizar Asesorías en el Panel Docente",
        steps: [
          "Las asesorías confirmadas o pendientes se muestran en la sección “Próximas Asesorías”.",
          "Las asesorías con estado “Pendiente” podrán ser confirmadas desde el correo o directamente desde el sistema.",
          "El panel también muestra indicadores generales de sincronización con Calendar, asesorías del mes y pendientes por confirmar.",
        ],
      },
      {
        title: "Confirmar o Cancelar Asesorías",
        steps: [
          "Ingresa a la sección “Mis asesorías” desde el menú principal o directamente desde el correo de confirmación o Google Calendar.",
          "Utiliza las pestañas “Próximas” e “Historial” para filtrar tus reservas.",
          "En cada tarjeta, selecciona “Confirmar” o “Cancelar” según corresponda.",
          "Toda modificación se refleja automáticamente en el sistema y en Google Calendar.",
          "Las asesorías confirmadas se marcan como “Completadas” al finalizar y las no confirmadas cambian a “Canceladas”.",
        ],
      },
      {
        title: "Uso del Asistente de Inteligencia Artificial",
        steps: [
          "Abre el chat flotante ubicado en la esquina inferior derecha de la pantalla.",
          "Formula tus solicitudes en lenguaje natural puedes listar asesores y servicios, verificar disponibilidad, agendar, confirmar o cancelar asesorías, y consultar información institucional",
          "El asistente interpretará tu solicitud y mostrará opciones disponibles de manera interactiva.",
          "También puedes usar los botones del chat para confirmar o cancelar con un solo clic.",
          "Todas las acciones realizadas mediante el asistente se sincronizan en tiempo real con tu cuenta y Google Calendar.",
        ],
      },
      {
        title: "Perfil del Docente y métricas",
        steps: [
          "Desde “Tu perfil” visualiza tus datos de contacto y tu rol.",
          "Revisa indicadores como asesorías completadas, canceladas, total de asesorías y tasa de éxito.",
          "Utiliza estas métricas para monitorear tu desempeño y planificar mejoras."
        ],
      },
      {
        title: "Vincular tu Cuenta de Telegram",
        steps: [
          "Desde el avatar de usuario, accede a la opción “Tu perfil”.",
          "Presiona el botón “Vincular Telegram” para iniciar la vinculación.",
          "Autoriza la apertura de Telegram y se envía el comando /start al bot institucional de CINAP.",
          "Una vez vinculada tu cuenta, desde Telegram podrás listar asesores y servicios, verificar disponibilidad, agendar, confirmar o cancelar asesorías, y consultar información institucional.",
          "Todas las acciones realizadas desde Telegram se sincronizan de forma inmediata con el sistema y con Google Calendar.",
        ],
      },
      {
        title: "Notificaciones",
        steps: [
          "El sistema envía automáticamente correos de confirmación y recordatorios previos a la hora agendada.",
          "Las asesorías se actualizan de forma automática en Google Calendar al ser confirmadas o modificadas."
        ],
      },
    ],
    asesor: [
      {
        title: "Inicio de Sesión y Acceso a la Plataforma",
        steps: [
          "Accede al portal y selecciona “Iniciar sesión con Google”.",
          "Autentícate con tu correo institucional y autoriza los permisos solicitados.",
          "Se habilitará la sincronización con Google Calendar para gestión de eventos.",
          "Una vez dentro, se mostrará el Panel del Asesor."
        ],
      },
      {
        title: "Vista general del Panel del Asesor",
        steps: [
          "Desde el panel podrás abrir cupos, revisar confirmaciones pendientes y consultar tus categorías y servicios activos.",
          "La sección “Próximas asesorías” muestra tus atenciones programadas y su estado.",
          "Los indicadores superiores presentan el total del mes y las confirmaciones pendientes."
        ],
      },
      {
        title: "Abrir cupos",
        steps: [
          "Haz clic en “Abrir cupo”. En “Servicio” selecciona la categoría y el servicio que tengas activo.",
          "En “Sala” define campus, edificio y sala. Puedes añadir notas operativas si corresponde.",
          "En “Horarios” elige fecha y rango entre 08:00 y 18:00 de lunes a viernes.",
          "Configura “Bloques sin cupos” para marcar tramos donde no se crearán cupos como pausas, reuniones, etc.",
          "Si necesitas repetir la configuración en varios días, selecciónalos en el calendario y utiliza “Guardar en fechas marcadas”.",
          "En “Confirmar” revisa el resumen y crea los cupos."
        ],
      },
      {
        title: "Mis cupos",
        steps: [
          "Accede a “Mis cupos” para visualizar todos los cupos creados con sus estados: Abierto, Ocupado, Cancelado o Expirado.",
          "Filtra por categoría, servicio, campus, estado o fecha para acotar la búsqueda.",
          "Desde cada tarjeta puedes editar fecha, horario, sala y notas, además, cancelar o eliminar el cupo cuando corresponda.",
          "Los cambios se reflejan inmediatamente en el sistema y en las vistas de los usuarios."
        ],
      },
      {
        title: "Solicitudes por confirmar",
        steps: [
          "Ingresa a “Solicitudes por confirmar” para revisar asesorías que requieren confirmación por correo de Google o por sistema.",
          "Cada solicitud muestra la información esencial."
        ],
      },
      {
        title: "Catálogo de categorías y servicios",
        steps: [
          "Desde “Categorías y servicios” consulta qué categorías tienes activas y los servicios disponibles en tu cuenta.",
          "Revisa el detalle de cada categoría."
        ],
      },
      {
        title: "Mis próximas asesorías",
        steps: [
          "Desde el panel principal, selecciona la opción “Ver todas las asesorías”.",
          "Utiliza las pestañas “Próximas” e “Historial” para revisar asesorías pendientes, confirmadas o finalizadas.",
          "En cada tarjeta, utiliza las acciones disponibles para confirmar o cancelar según corresponda.",
          "También puedes confirmar la asistencia desde el correo recibido o desde el evento en Google Calendar.",
          "El sistema actualiza los estados automáticamente: las asesorías confirmadas se registran como “Completadas” y las no confirmadas cambian a “Canceladas”."
        ],
      },
      {
        title: "Uso del Asistente de Inteligencia Artificial",
        steps: [
          "Abre el chat flotante ubicado en la esquina inferior derecha de la pantalla.",
          "Formula tus solicitudes en lenguaje natural puedes listar asesores y servicios, verificar disponibilidad, agendar, confirmar o cancelar asesorías, y consultar información institucional",
          "El asistente interpretará tu solicitud y mostrará opciones disponibles de manera interactiva.",
          "También puedes usar los botones del chat para confirmar o cancelar con un solo clic.",
          "Todas las acciones realizadas mediante el asistente se sincronizan en tiempo real con tu cuenta y Google Calendar.",
        ],
      },
      {
        title: "Perfil del asesor y métricas",
        steps: [
          "Desde “Tu perfil” visualiza tus datos de contacto y tu rol.",
          "Revisa indicadores como asesorías completadas, canceladas, total de asesorías y tasa de éxito.",
          "Utiliza estas métricas para monitorear tu desempeño y planificar mejoras."
        ],
      },
      {
        title: "Vincular tu Cuenta de Telegram",
        steps: [
          "Desde el avatar de usuario, accede a la opción “Tu perfil”.",
          "Presiona el botón “Vincular Telegram” para iniciar la vinculación.",
          "Autoriza la apertura de Telegram y se envía el comando /start al bot institucional de CINAP.",
          "Una vez vinculada tu cuenta, desde Telegram podrás listar asesores y servicios, verificar disponibilidad, agendar, confirmar o cancelar asesorías, y consultar información institucional.",
          "Todas las acciones realizadas desde Telegram se sincronizan de forma inmediata con el sistema y con Google Calendar.",
        ],
      },

      {
        title: "Notificaciones y Seguimiento",
        steps: [
          "El sistema envía automáticamente correos de confirmación y recordatorios previos a la hora agendada.",
          "Las asesorías se actualizan de forma automática en Google Calendar al ser confirmadas o modificadas."
        ],
      },
    ],
    admin: [
      {
        title: "Inicio de sesión y acceso a la plataforma",
        steps: [
          "Accede al portal y selecciona “Iniciar sesión con Google”.",
          "Autentícate con tu correo institucional y autoriza los permisos solicitados.",
          "Se habilitará la sincronización con Google Calendar para gestión de eventos.",
          "Una vez dentro, se mostrará el Panel del Administrador."
        ],
      },
      {
        title: "Vista general del Panel Administrativo",
        steps: [
          "En la cabecera se muestran tarjetas con conteos globales.",
          "La sección “Próximas asesorías” lista reservas del sistema siendo el administrador puede ver el total de citas de asesores y docentes.",
          "El panel lateral ofrece accesos directos: ver docentes, ver asesores, gestionar catálogos y gestionar ubicaciones.",
          "Utiliza el botón “Registrar asesor” para iniciar el alta de nuevos perfiles."
        ],
      },
      {
        title: "Registrar asesores",
        steps: [
          "Accede al apartado “Registrar asesor” desde el Panel Administrador para incorporar nuevos miembros al equipo de asesoría.",
          "En la sección de datos básicos, ingresa el nombre completo y la dirección de correo electrónico institucional del asesor.",
          "Selecciona las categorías en las cuales el nuevo asesor brindará apoyo académico o pedagógico, conforme a sus áreas de especialización.",
          "A continuación, define los servicios específicos que podrá ofrecer dentro de cada categoría seleccionada, indicando aquellos que se ajusten a su perfil profesional.",
          "Finalmente, revisa cuidadosamente el resumen de información y confirma el registro. Una vez completado el proceso, el nuevo asesor quedará habilitado para operar en el sistema."
        ],
      },
      {
        title: "Gestión de Docentes",
        steps: [
          "Ingresa a “Ver Docentes” para administrar el listado de docentes registrados.",
          "Utiliza el buscador para filtrar por nombre o correo electrónico.",
          "Selecciona “Editar” para actualizar nombre o correo según corresponda.",
          "Si es necesario, utiliza “Eliminar” para remover un registro obsoleto."
        ],
      },
      {
        title: "Gestión de Asesores",
        steps: [
          "Accede a “Ver Asesores” para administrar perfiles de asesor.",
          "Filtra por categoría o servicio para localizar rápidamente al asesor requerido.",
          "Desde cada tarjeta, utiliza “Editar” para actualizar nombre, correo, categorías y servicios activos.",
          "Si el perfil ya no corresponde, selecciona “Eliminar” para retirarlo del sistema."
        ],
      },
      {
        title: "Gestión de Catálogos de Categorías y Servicios",
        steps: [
          "Abre “Gestionar Catálogos” para administrar categorías y servicios institucionales.",
          "Revisa los contadores de categorías y servicios activos para verificar el estado general.",
          "En cada categoría, usa “Editar” para modificar detalles o “Desactivar” para ocultarla temporalmente.",
          "Utiliza el boton “Agregar” para crear nuevas categorías o añadir servicios y confirma los cambios antes de salir."
        ],
      },
      {
        title: "Gestión de Ubicaciones",
        steps: [
          "Ingresa a “Gestionar Ubicaciones” para administrar campus, edificios y salas.",
          "Utiliza las pestañas para cambiar entre los tres niveles y el buscador para localizar registros.",
          "Selecciona el boton “Crear” para añadir un nuevo elemento o el boton “Editar” para actualizar datos tambien puedes presionar los botones de “Desactivar” o “Eliminar” cuando corresponda.",
          "Verifica la capacidad activa total y la consistencia de la jerarquía antes de guardar."
        ],
      },
      {
        title: "Próximas asesorías y monitoreo del sistema",
        steps: [
          "Desde el panel principal, revisa el bloque “Próximas asesorías” para observar la agenda del sistema.",
          "El administrador visualiza asesorías de asesores y docentes, con su estado respectivo.",
          "Realiza seguimiento periódico para anticipar congestión de demanda o necesidad de nuevos servicios."
        ],
      },
      {
        title: "Perfil del Administrador  y métricas",
        steps: [
          "Desde “Tu perfil” visualiza tus datos de contacto y tu rol.",
          "Revisa indicadores como asesorías completadas, canceladas, total de asesorías y tasa de éxito.",
          "Utiliza estas métricas para monitorear el desempeño y planificar mejoras."
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
