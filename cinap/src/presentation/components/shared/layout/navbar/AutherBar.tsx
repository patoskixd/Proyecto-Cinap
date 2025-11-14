"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";

type MeShape = {
  authenticated: boolean;
  user?: {
    name?: string | null;
    role?: string | null;
  };
};

export function AuthedBar({
  me,
  onSignOut,
}: {
  me: MeShape;
  onSignOut: () => void | Promise<void>;
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const name = me?.user?.name ?? "Usuario";
  const role = me?.user?.role ?? "Usuario";

  const getInitials = (value: string) =>
    value
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative flex items-center gap-4" ref={dropdownRef}>
      <Link
        href="/dashboard"
        className="hidden rounded-xl border border-blue-200/50 bg-blue-100/80 px-4 py-2 text-blue-700 shadow-md backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-lg sm:inline-flex items-center gap-2 font-medium"
        aria-label="Ir al panel"
      >
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 10.5L12 4l9 6.5" />
          <path d="M5 9.5V20h5v-5h4v5h5V9.5" />
        </svg>
        <span className="text-sm">Panel</span>
      </Link>

      <button
        onClick={() => setIsDropdownOpen((prev) => !prev)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-sm font-bold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:ring-offset-2"
        aria-label="Menu de usuario"
        aria-expanded={isDropdownOpen}
        aria-haspopup="true"
      >
        {getInitials(name)}
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl ring-1 ring-black/5 animate-in slide-in-from-top-1 duration-200 z-50">
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="truncate text-sm font-semibold text-gray-900">{name}</p>
            <p className="text-xs text-gray-600 capitalize">{role}</p>
          </div>

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

            <div className="my-1 h-px bg-gray-100" />

            <button
              onClick={() => {
                setIsDropdownOpen(false);
                onSignOut();
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 active:bg-gray-100"
            >
              <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Cerrar sesion
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
