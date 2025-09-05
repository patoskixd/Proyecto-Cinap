"use client";
import Link from "next/link";
import { useAuth } from "@/presentation/hooks/useAuth";

export default function Navbar() {
  const { me, mounted, signOut } = useAuth();
  const isAuthed = me.authenticated === true;

  const rightSkeleton = (
    <div className="h-10 w-40 animate-pulse rounded-full bg-neutral-100" />
  );

  const publicRight = (
    <>
      <Link href={{ pathname: "/", hash: "inicio" }} className="hidden text-neutral-700 transition-colors hover:text-blue-600 md:inline">Inicio</Link>
      <Link href={{ pathname: "/", hash: "servicios" }} className="hidden text-neutral-700 transition-colors hover:text-blue-600 md:inline">Servicios</Link>
      <Link href={{ pathname: "/", hash: "contacto" }} className="hidden text-neutral-700 transition-colors hover:text-blue-600 md:inline">Contacto</Link>
      <Link href="/auth/login" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 px-6 py-3 font-semibold text-white shadow-[0_4px_15px_rgba(37,99,235,0.3)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(37,99,235,0.4)]">
        <span>Iniciar Sesión</span>
      </Link>
    </>
  );

  const authedRight = (
    
    <div className="flex items-center gap-4">
      <span className="hidden text-neutral-700 md:inline">
        Hola, <strong>{isAuthed ? me.user?.name : ""}</strong>
      </span>
      {/* Mostrar el rol en la navbar */}
      <span className="text-sm text-neutral-600">
        Rol: <strong>{isAuthed ? me.user?.role : "Invitado" }</strong>
      </span>
      <Link href={{ pathname: "/dashboard"}} className="hidden text-neutral-700 transition-colors hover:text-blue-600 md:inline">Inicio</Link>
      <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-full border-2 border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 transition-all hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow">
        Perfil
      </Link>
      <button onClick={signOut} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 px-6 py-3 font-semibold text-white shadow-[0_4px_15px_rgba(37,99,235,0.3)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(37,99,235,0.4)]">
        Cerrar sesión
      </button>
    </div>
  );

  return (
    <nav className="fixed inset-x-0 top-0 z-50 bg-white/95 backdrop-blur shadow-sm">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-8 py-4">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-blue-600">
          <span className="text-3xl leading-none">🎓</span><span>CINAP</span>
        </Link>
        <div className="flex items-center gap-8">
          {!mounted ? rightSkeleton : (isAuthed ? authedRight : publicRight)}
        </div>
      </div>
    </nav>
  );
}
