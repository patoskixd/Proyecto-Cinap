"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type LoginResponse =
  | { access_token: string; token_type?: string; user?: any }
  | { detail?: string };

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        let message = "Credenciales inválidas";
        try {
          const data = (await res.json()) as LoginResponse;
          if ("detail" in data && data.detail) message = data.detail;
        } catch {}
        throw new Error(message);
      }

      try {
        const data = (await res.json()) as LoginResponse;
        if (data && "access_token" in data && data.access_token) {
          const storage = remember ? localStorage : sessionStorage;
          storage.setItem("token", data.access_token);
          if (data.user) storage.setItem("user", JSON.stringify(data.user));
        }
      } catch {
      }

      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message ?? "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = () => {
    window.location.href =
      `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/auth/google/login`;
  };

  return (
    <section className="relative flex min-h-[calc(100vh-72px)] items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#f8fafc_0%,#e2e8f0_100%)] px-4 py-6 md:py-10">
      {/* Shapes de fondo */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[10%] top-[10%] h-[200px] w-[200px] rounded-full bg-[linear-gradient(135deg,#2563eb,#10b981)] opacity-10 blur-[1px] animate-bounce" />
        <div className="absolute right-[15%] top-[60%] h-[150px] w-[150px] rounded-full bg-[linear-gradient(135deg,#10b981,#2563eb)] opacity-10 blur-[1px] animate-bounce [animation-delay:200ms]" />
        <div className="absolute bottom-[20%] left-[20%] h-[100px] w-[100px] rounded-full bg-[linear-gradient(135deg,#2563eb,#1d4ed8)] opacity-10 blur-[1px] animate-bounce [animation-delay:400ms]" />
      </div>

      <div className="relative z-10 w-full max-w-[450px]">
        <div className="rounded-3xl border border-white/20 bg-white/95 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.1)] backdrop-blur-md md:p-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-3xl text-white shadow-[0_8px_25px_rgba(37,99,235,0.3)]">
              🔐
            </div>
            <h1 className="text-2xl font-bold text-neutral-900">Iniciar Sesión</h1>
            <p className="mt-1 text-sm text-neutral-500">
              Accede a tu cuenta para gestionar tus asesorías
            </p>
          </div>
          {/* Form */}
          <form onSubmit={onSubmit} className="mb-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-neutral-700">
                Correo Electrónico
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ejemplo@email.com"
                  className="w-full rounded-xl border-2 border-neutral-200 bg-white/80 px-4 py-3 text-[15px] placeholder:text-neutral-400 outline-none transition focus:border-blue-600 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)]"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-neutral-700">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border-2 border-neutral-200 bg-white/80 px-4 py-3 text-[15px] placeholder:text-neutral-400 outline-none transition focus:border-blue-600 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)]"
                />
              </div>
            </div>

            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <label className="inline-flex select-none items-center gap-2 text-sm text-neutral-600">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 accent-blue-600"
                />
                Recordarme
              </label>

              <a
                href="#"
                className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="group mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 px-6 py-3 text-lg font-semibold text-white shadow-[0_8px_25px_rgba(37,99,235,0.3)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_35px_rgba(37,99,235,0.4)] disabled:opacity-60"
            >
              <span>{loading ? "Ingresando..." : "Iniciar Sesión"}</span>
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-neutral-200" />
            <span className="relative bg-white/95 px-4 text-sm text-neutral-500">
              O continúa con
            </span>
          </div>

          {/* Google */}
          <button
            onClick={onGoogle}
            className="mb-6 inline-flex w-full items-center justify-center gap-3 rounded-xl border-2 border-neutral-200 bg-white px-6 py-3 text-[15px] font-semibold text-neutral-700 transition-all hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-[0_4px_15px_rgba(0,0,0,0.1)]"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Continuar con Google</span>
          </button>

          {/* Registro */}
          <div className="text-center text-sm text-neutral-600">
            ¿No tienes una cuenta?{" "}
            <a href="/dashboard" className="font-semibold text-blue-600 hover:text-blue-700">
              Regístrate aquí
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}


  

