"use client";

import Image from "next/image";

export default function LoginForm() {
  const onGoogle = () => {
    window.location.href = "/api/auth/google/login";
  };

  return (
    <section className="relative flex min-h-[calc(100vh-72px)] items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#f8fafc_0%,#e2e8f0_100%)] px-4 py-6 md:py-10">
      {/* Shapes de fondo */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[10%] top-[10%] h-[200px] w-[200px] rounded-full bg-[linear-gradient(135deg,#2563eb,#10b981)] opacity-10 blur-[1px] animate-bounce" />
        <div className="absolute right-[15%] top-[60%] h-[150px] w-[150px] rounded-full bg-[linear-gradient(135deg,#10b981,#2563eb)] opacity-10 blur-[1px] animate-bounce [animation-delay:200ms]" />
        <div className="absolute bottom-[20%] left-[20%] h-[100px] w-[100px] rounded-full bg-[linear-gradient(135deg,#2563eb,#1d4ed8)] opacity-10 blur-[1px] animate-bounce [animation-delay:400ms]" />
      </div>

      <div className="relative z-10 w-full max-w-[480px]">
        <div className="rounded-3xl border border-white/30 bg-white/95 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.12)] backdrop-blur-md md:p-10">
          {/* Header */}
          <div className="mb-10 text-center">
            <div className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-white shadow-[0_10px_30px_rgba(0,0,0,0.15)] p-4">
              <Image
                src="/uct-logo.png"
                alt="Logo Universidad Católica de Temuco"
                width={96}
                height={96}
                className="h-full w-full object-contain"
                priority
              />
            </div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-3">
              Bienvenido a CINAP
            </h1>
            <p className="text-[15px] text-neutral-600 leading-relaxed max-w-sm mx-auto">
              Inicia sesión con tu cuenta de Google para acceder al sistema de gestión de asesorías y calendario
            </p>
          </div>

          {/* Google Button */}
          <button
            onClick={onGoogle}
            className="group relative mb-8 inline-flex w-full items-center justify-center gap-3 rounded-xl border-2 border-neutral-200 bg-white px-6 py-4 text-base font-semibold text-neutral-800 shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-[0_8px_20px_rgba(37,99,235,0.15)] active:translate-y-0"
          >
            <svg 
              className="h-6 w-6 transition-transform group-hover:scale-110" 
              viewBox="0 0 24 24" 
              width="24" 
              height="24" 
              aria-hidden="true"
            >
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Continuar con Google</span>
            <svg 
              className="h-5 w-5 opacity-0 -ml-2 transition-all group-hover:opacity-100 group-hover:ml-0" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

        </div>
      </div>
    </section>
  );
}


  

