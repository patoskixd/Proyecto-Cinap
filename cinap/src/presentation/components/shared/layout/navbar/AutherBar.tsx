"use client";
import Link from "next/link";
import { useAuth } from "@/presentation/components/auth/hooks/useAuth";
import { useState, useRef, useEffect } from "react";

type MeShape = {
  authenticated: boolean;
  user?: {
    name?: string | null;
    role?: string | null;
  };
};

export function AuthedBar({ me }: { me: MeShape }) {
  const { signOut } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const name = me?.user?.name ?? "Usuario";
  const role = me?.user?.role ?? "Usuario";
  
  // Función para obtener las iniciales
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex w-full items-center justify-between">
      <Link
        href="/dashboard"
        className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-blue-700 to-yellow-500 bg-clip-text text-transparent"
        aria-label="Ir al dashboard"
      >
        CINAP
      </Link>

      {/* GitHub Style User Menu */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-sm font-bold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-300/50 focus:ring-offset-2 focus:ring-offset-white"
          aria-label="Menú de usuario"
          aria-expanded={isDropdownOpen}
        >
          {getInitials(name)}
        </button>

        {/* GitHub Style Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl ring-1 ring-black/5 animate-in slide-in-from-top-1 duration-200">
            {/* User Info Header */}
            <div className="border-b border-gray-100 px-4 py-3">
              <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
              <p className="text-xs text-gray-600 capitalize">{role}</p>
            </div>
            
            {/* Menu Items */}
            <div className="py-1">
              <Link
                href="/profile"
                onClick={() => setIsDropdownOpen(false)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 active:bg-gray-100"
              >
                <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Tu perfil
              </Link>
              
              <div className="my-1 h-px bg-gray-100"></div>
              
              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  signOut();
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 active:bg-gray-100"
              >
                <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Cerrar sesión
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
