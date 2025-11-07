"use client";

import AyudaNavigation from "@/presentation/components/ayuda/AyudaNavigation";
import GuiasSection from "@/presentation/components/ayuda/GuiasSection";
import GuiasCompletasSection from "@/presentation/components/ayuda/GuiasCompletasSection";


// Página de Ayuda con guías rápidas, guías completas y FAQ
// Incluye navegación con anclas: /ayuda#guias-rapidas, /ayuda#guias-completas, /ayuda#faq
// Ruta pública: /ayuda (accesible sin autenticación)
export default function AyudaPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-16 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-amber-500 to-orange-500 rounded-3xl flex items-center justify-center shadow-lg shadow-amber-500/20">
            <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-3">Centro de Ayuda</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Todo lo que necesitas saber para aprovechar al máximo la plataforma CINAP
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <AyudaNavigation />
        <GuiasSection />
        <GuiasCompletasSection />
      </div>
    </div>
  );
}

