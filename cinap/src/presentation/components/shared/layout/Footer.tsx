"use client";

import Image from "next/image";

// Componente que muestra el pie de página en todas las páginas 
export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 px-6 py-12 text-white border-t border-slate-600/30">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-3">
            <Image
              src="/uct-logo.png"
              alt="Logo UCT"
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
            />
            <span className="text-2xl font-bold text-white">CINAP</span>
            <p className="ml-3 text-sm text-slate-300 font-medium">Centro de Innovación Académica y Pedagógica</p>
          </div>

          <div className="flex gap-6">
            <a href="/terminos" className="text-sm text-slate-300 transition-colors hover:text-white font-medium">
              Términos
            </a>
            <a href="/privacidad" className="text-sm text-slate-300 transition-colors hover:text-white font-medium">
              Privacidad
            </a>
            <a href="/ayuda" className="text-sm text-slate-300 transition-colors hover:text-white font-medium">
              Ayuda
            </a>
          </div>
        </div>
      </footer>
  );
}
