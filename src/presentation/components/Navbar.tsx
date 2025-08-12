"use client";
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-8 py-4">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-blue-600">
          <span className="text-3xl leading-none">🎓</span>
          <span>CINAP</span>
        </Link>

        <div className="flex items-center gap-8">
          <a href="#inicio" className="hidden text-[--muted-foreground] transition-colors hover:text-blue-600 md:inline">
            Inicio
          </a>
          <a href="#servicios" className="hidden text-[--muted-foreground] transition-colors hover:text-blue-600 md:inline">
            Servicios
          </a>
          <a href="#contacto" className="hidden text-[--muted-foreground] transition-colors hover:text-blue-600 md:inline">
            Contacto
          </a>

          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 px-6 py-3 font-semibold text-white shadow-[0_4px_15px_rgba(37,99,235,0.3)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(37,99,235,0.4)]"
          >
            <span>Iniciar Sesión</span>
            <span className="text-lg leading-none">👤</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
