"use client";
import Link from "next/link";
import { useAuth } from "@/presentation/components/auth/hooks/useAuth";

type MeShape = {
  authenticated: boolean;
  user?: {
    name?: string | null;
    role?: string | null;
  };
};


export function AuthedBar({ me }: { me: MeShape }) {
  const { signOut } = useAuth();
  const name = me?.user?.name ?? "Usuario";
  const role = me?.user?.role ?? "Advisor";

  return (
    <div className="flex w-full items-center justify-between">
      <Link
        href="/dashboard"
        className="flex items-center gap-2 text-xl font-bold text-blue-600"
        aria-label="Ir al dashboard"
      >
        <span className="text-3xl leading-none">🎓</span>
        <span>CINAP</span>
      </Link>

      <div className="hidden md:flex items-center gap-6">
        <span className="text-neutral-700 text-base">
          Hola,{" "}
          <strong className="font-semibold text-neutral-900">{name}</strong>
        </span>
        <span className="text-neutral-600 text-base">
          Rol:
          <span className="ml-2 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
            {role}
          </span>
        </span>
      </div>

      <div className="flex items-center gap-8">
        <Link href="/dashboard" className="hidden md:inline text-neutral-700 transition-colors hover:text-blue-600 text-base leading-none">
          Inicio
        </Link>
        <Link href="/profile" className="hidden md:inline text-neutral-700 transition-colors hover:text-blue-600 text-base leading-none">
          Perfil
        </Link>
        <button onClick={signOut} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 px-6 py-3 font-semibold text-white shadow-[0_4px_15px_rgba(37,99,235,0.30)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(37,99,235,0.40)]">
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
