"use client";

// Componente que muestra el pie de página en todas las páginas 
export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-slate-800 via-slate-900 to-blue-900 px-6 py-12 text-white">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-blue-300 to-yellow-400 bg-clip-text text-transparent">CINAP</span>
            <p className="ml-3 text-sm text-blue-200 font-medium">Centro de Innovación Académica y Pedagógica</p>
          </div>

          <div className="flex gap-6">
            <a href="#" className="text-sm text-blue-200 transition-colors hover:text-yellow-400 font-medium">
              Términos
            </a>
            <a href="#" className="text-sm text-blue-200 transition-colors hover:text-yellow-400 font-medium">
              Privacidad
            </a>
            <a href="#" className="text-sm text-blue-200 transition-colors hover:text-yellow-400 font-medium">
              Soporte
            </a>
          </div>
        </div>
      </footer>
  );
}
