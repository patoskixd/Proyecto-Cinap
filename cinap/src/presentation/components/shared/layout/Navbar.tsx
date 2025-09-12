"use client";
import Link from "next/link";
import { useAuth } from "@/presentation/components/auth/hooks/useAuth";
import { Suspense } from "react";
import { AuthedBar } from "@/presentation/components/shared/layout/navbar/AutherBar";

export default function Navbar() {
  const { me, mounted } = useAuth();
  const isAuthed = me?.authenticated === true;

  const rightSkeleton = (
    <div className="h-10 w-40 animate-pulse rounded-full bg-neutral-100" />
  );

  const PublicRight = () => (
    <>
      <Link
        href={{ pathname: "/", hash: "inicio" }}
        className="hidden text-neutral-700 transition-colors hover:text-blue-600 md:inline"
      >
        Inicio
      </Link>
      <Link
        href={{ pathname: "/", hash: "servicios" }}
        className="hidden text-neutral-700 transition-colors hover:text-blue-600 md:inline"
      >
        Servicios
      </Link>
      <Link
        href={{ pathname: "/", hash: "contacto" }}
        className="hidden text-neutral-700 transition-colors hover:text-blue-600 md:inline"
      >
        Contacto
      </Link>
      <Link
        href="/auth/login"
        className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 px-6 py-3 font-semibold text-white shadow-[0_4px_15px_rgba(37,99,235,0.3)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(37,99,235,0.4)]"
      >
        <span>Iniciar Sesión</span>
      </Link>
    </>
  );

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-black/10 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-8 py-4 md:px-8">
        {!isAuthed && (
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-blue-600">
            <span className="text-3xl leading-none">🎓</span>
            <span>CINAP</span>
          </Link>
        )}

        <div className="flex flex-1 items-center justify-end gap-6">
          <Suspense fallback={rightSkeleton}>
            {!mounted ? rightSkeleton : isAuthed ? <AuthedBar me={me} /> : <PublicRight />}
          </Suspense>
        </div>
      </div>
    </nav>
  );
}
