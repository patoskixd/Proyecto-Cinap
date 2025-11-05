"use client";

// Componente de navegación para la página de ayuda
// Proporciona enlaces a las diferentes secciones: guías rápidas, guías completas y FAQ
export default function AyudaNavigation() {
  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.querySelector(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav className="mb-12 flex flex-wrap justify-center gap-3">
      <a
        href="#guias-rapidas"
        onClick={(e) => scrollToSection(e, '#guias-rapidas')}
        className="px-6 py-3 bg-white border-2 border-gray-200 rounded-xl font-semibold text-gray-700 transition-all hover:border-blue-500 hover:text-blue-600 hover:shadow-md"
      >
        Guías Rápidas
      </a>
      <a
        href="#guias-completas"
        onClick={(e) => scrollToSection(e, '#guias-completas')}
        className="px-6 py-3 bg-white border-2 border-gray-200 rounded-xl font-semibold text-gray-700 transition-all hover:border-blue-500 hover:text-blue-600 hover:shadow-md"
      >
        Guías Completas
      </a>
      <a
        href="#faq"
        onClick={(e) => scrollToSection(e, '#faq')}
        className="px-6 py-3 bg-white border-2 border-gray-200 rounded-xl font-semibold text-gray-700 transition-all hover:border-blue-500 hover:text-blue-600 hover:shadow-md"
      >
        Preguntas Frecuentes
      </a>
    </nav>
  );
}
