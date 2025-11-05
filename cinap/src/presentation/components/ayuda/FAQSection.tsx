"use client";

import { useState } from "react";

// Componente de FAQ con acordeón interactivo
// Muestra preguntas frecuentes sobre el uso de la plataforma CINAP
// Optimizado para accesibilidad (ARIA) y performance (Lighthouse)
export default function FAQSection() {
  const [activeQuestion, setActiveQuestion] = useState<number | null>(null);

  const toggleQuestion = (index: number) => {
    setActiveQuestion(activeQuestion === index ? null : index);
  };

  const faqItems = [
    {
      question: "¿Cómo puedo reservar una asesoría?",
      answer:
        "Para reservar una asesoría, inicia sesión en tu cuenta, dirígete al panel de reservas y selecciona el asesor, fecha y horario disponible que mejor se ajuste a tus necesidades. Confirma la reserva y recibirás una notificación por correo electrónico.",
    },
    {
      question: "¿Puedo cancelar o modificar una asesoría?",
      answer:
        "Sí, puedes cancelar o modificar tu asesoría con al menos 24 horas de anticipación. Ve a tu panel de reservas, selecciona la asesoría que deseas cambiar y elige la opción de modificar o cancelar. Te recomendamos hacerlo con la mayor anticipación posible para no afectar al asesor.",
    },
    {
      question: "¿Qué hago si olvidé mi contraseña?",
      answer:
        "Si olvidaste tu contraseña, haz clic en ¿Olvidaste tu contraseña? en la página de inicio de sesión. Ingresa tu correo electrónico institucional y recibirás un enlace para restablecer tu contraseña.",
    },
    {
      question: "¿Cómo funcionan las notificaciones?",
      answer:
        "Recibirás notificaciones por correo electrónico cuando reserves, modifiques o canceles una asesoría. También recibirás recordatorios antes de tu asesoría programada. Puedes configurar tus preferencias de notificación en tu perfil.",
    },
    {
      question: "¿Qué tipos de asesorías están disponibles?",
      answer:
        "Ofrecemos diversos tipos de asesorías según las necesidades académicas: metodologías de enseñanza, uso de tecnologías educativas, diseño de evaluaciones, estrategias didácticas, entre otras. Consulta con cada asesor su área de especialización.",
    },
    {
      question: "¿Cuánto tiempo dura una asesoría?",
      answer:
        "La duración estándar de una asesoría es de 60 minutos, pero puede variar según el tipo de asesoría y las necesidades específicas. Al momento de reservar, podrás ver la duración estimada.",
    },
    {
      question: "¿Puedo tener asesorías grupales?",
      answer:
        "Sí, algunas asesorías pueden realizarse de forma grupal. Al momento de reservar, especifica si deseas una asesoría grupal y el número de participantes. Esto dependerá de la disponibilidad y tipo de asesoría.",
    },
    {
      question: "¿Las asesorías son presenciales u online?",
      answer:
        "Ofrecemos ambas modalidades. Al reservar, podrás seleccionar la modalidad de tu preferencia según la disponibilidad del asesor. Las asesorías online se realizan mediante la plataforma institucional de videoconferencias.",
    },
    {
      question: "¿Cómo funciona el asistente de IA?",
      answer:
        "Nuestro asistente de IA te ayuda a reservar, modificar y cancelar asesorías mediante conversación natural. Simplemente escribe lo que necesitas y el asistente te guiará en el proceso. Puedes preguntarle sobre disponibilidad, tipos de asesorías y gestionar tus reservas.",
    },
    {
      question: "¿Qué hago si tengo problemas técnicos durante una asesoría online?",
      answer:
        "Si experimentas problemas técnicos, contacta inmediatamente al soporte técnico de CINAP o al asesor mediante los canales de comunicación alternativos proporcionados. También puedes reprogramar la asesoría si los problemas persisten.",
    },
  ];

  return (
    <section id="faq" className="mb-16 scroll-mt-24">
      <div className="mb-8 text-center">
        <h2 className="mb-3 text-3xl font-bold text-gray-900">Preguntas Frecuentes</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Respuestas rápidas a las dudas más comunes sobre CINAP
        </p>
      </div>
      
      <div className="max-w-3xl mx-auto space-y-3" role="list">
        {faqItems.map((item, index) => (
          <article
            key={index}
            className="rounded-xl bg-white shadow-sm overflow-hidden transition-all hover:shadow-md border border-gray-200"
            role="listitem"
          >
            <button
              onClick={() => toggleQuestion(index)}
              aria-expanded={activeQuestion === index}
              aria-controls={`faq-answer-${index}`}
              className="w-full flex items-center justify-between p-5 text-left transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
            >
              <h3 className="text-base font-semibold text-gray-900 pr-4">
                {item.question}
              </h3>
              <svg
                className={`h-5 w-5 flex-shrink-0 text-gray-600 transition-transform duration-300 ${
                  activeQuestion === index ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div
              id={`faq-answer-${index}`}
              className={`transition-all duration-300 ${
                activeQuestion === index ? "max-h-96" : "max-h-0"
              } overflow-hidden`}
            >
              <p className="px-5 pb-5 text-gray-700 leading-relaxed">
                {item.answer}
              </p>
            </div>
          </article>
        ))}
      </div>


    </section>
  );
}
