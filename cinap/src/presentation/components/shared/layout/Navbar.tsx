"use client";

import Link from "next/link";
import { useAuth } from "@/presentation/components/auth/hooks/useAuth";
import { useState, useEffect } from "react";
import { AuthedBar } from "@/presentation/components/shared/layout/navbar/AutherBar";

export default function Navbar() {
  const { me, mounted, signOut } = useAuth();
  const [isHydrated, setIsHydrated] = useState(false);

  // Solo hidrata despues del primer render
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const isAuthed = isHydrated && mounted && me?.authenticated === true;

  const rightSkeleton = (
    <div className="flex items-center gap-3">
      <div className="h-8 w-24 animate-pulse rounded-lg bg-blue-100" />
      <div className="h-9 w-9 animate-pulse rounded-full bg-blue-200" />
    </div>
  );

  const PublicRight = () => (
    <>
      <div className="hidden items-center gap-6 md:flex">
        <Link
          href={{ pathname: "/", hash: "inicio" }}
          className="relative px-3 py-2 font-medium text-blue-800 transition-all duration-300 hover:text-blue-600 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-gradient-to-r after:from-blue-600 after:to-yellow-500 after:transition-all after:duration-300 hover:after:w-full"
        >
          Inicio
        </Link>
        <Link
          href={{ pathname: "/", hash: "servicios" }}
          className="relative px-3 py-2 font-medium text-blue-800 transition-all duration-300 hover:text-blue-600 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-gradient-to-r after:from-blue-600 after:to-yellow-500 after:transition-all after:duration-300 hover:after:w-full"
        >
          Servicios
        </Link>
      </div>

      <Link
        href="/auth/login"
        className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-yellow-500 px-6 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:scale-105"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-700 via-blue-800 to-yellow-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="relative flex items-center gap-2">
          <svg className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
          <span>Iniciar Sesion</span>
        </div>
      </Link>
    </>
  );

  const brandHref = isAuthed ? "/dashboard" : "/";

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-blue-200/30 bg-gradient-to-br from-white via-blue-50/40 to-yellow-50/30 shadow-lg backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-8 py-4 md:px-8">
        <Link
          href={brandHref}
          className="flex items-center text-2xl font-bold bg-gradient-to-r from-blue-600 via-blue-700 to-yellow-500 bg-clip-text text-transparent"
          aria-label="Ir a CINAP"
        >
          CINAP
        </Link>

        <div className="flex flex-1 items-center justify-end gap-6">
          {!isHydrated || !mounted
            ? rightSkeleton
            : isAuthed
              ? <AuthedBar me={me} onSignOut={signOut} />
              : <PublicRight />}
        </div>
      </div>
    </nav>
  );
}
