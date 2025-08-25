"use client";
import Link from "next/link";   

// Componente que muestra el pie de página en todas las páginas 
export default function Footer() {
  return (
    <footer className="bg-neutral-900 px-6 py-12 text-white">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-3">
            <div className="text-2xl leading-none text-blue-600">🎓</div>
            <span className="text-lg font-bold text-blue-600">CINAP</span>
            <p className="ml-3 text-sm text-neutral-400">Centro de Innovación Académica y Pedagógica</p>
          </div>

          <div className="flex gap-6">
            <a href="#" className="text-sm text-neutral-400 transition-colors hover:text-blue-600">
              Términos
            </a>
            <a href="#" className="text-sm text-neutral-400 transition-colors hover:text-blue-600">
              Privacidad
            </a>
            <a href="#" className="text-sm text-neutral-400 transition-colors hover:text-blue-600">
              Soporte
            </a>
          </div>
        </div>
      </footer>
  );
}
