// src/presentation/hooks/useAuth.ts
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

/** ---------- Tipos ---------- */
export type UserDTO = {
  id: string;
  email: string;
  name: string;
  role: string; // "teacher" | "advisor" | "admin" o nombres equivalentes
};

export type Me =
  | { authenticated: false }
  | { authenticated: true; user: UserDTO };

/** ---------- Constantes ---------- */
const LOGIN_PATH = "/auth/login";

/** GET /api/auth/me con cookies y sin caché */
async function fetchMe(): Promise<Me> {
  try {
    const res = await fetch("/api/auth/me", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return { authenticated: false };

    const data = (await res.json()) as Me;

    if (
      data &&
      typeof data === "object" &&
      "authenticated" in data &&
      (data as any).authenticated === true &&
      (data as any).user
    ) {
      return data as { authenticated: true; user: UserDTO };
    }
    return { authenticated: false };
  } catch {
    return { authenticated: false };
  }
}

/** ---------- Hook ---------- */
export function useAuth() {
  const router = useRouter();
  const pathname = usePathname();

  const [me, setMe] = useState<Me>({ authenticated: false });
  const [mounted, setMounted] = useState(false);

  // Carga inicial del /me y redirección si corresponde
  useEffect(() => {
    let alive = true;
    (async () => {
      const data = await fetchMe();
      if (!alive) return;

      setMe(data);
      setMounted(true);

      if (data.authenticated === false && pathname !== LOGIN_PATH) {
        const next = pathname || "/";
        router.replace(`${LOGIN_PATH}?next=${encodeURIComponent(next)}`);
      }
    })();
    return () => {
      alive = false;
    };
  }, [pathname, router]);

  /** Cerrar sesión (borra cookie en API route y redirige a /auth/login) */
  const signOut = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } finally {
      setMe({ authenticated: false });
      router.replace(LOGIN_PATH);
      router.refresh();
    }
  }, [router]);

  /** Reemitir JWT leyendo rol actual de BD (sin relogin) */
  const refreshSession = useCallback(async () => {
    try {
      await fetch("/api/auth/reissue", { method: "POST", credentials: "include" });
      const data = await fetchMe();
      setMe(data);
      router.refresh();
    } catch {
      // si falla, fuerza login
      setMe({ authenticated: false });
      router.replace(LOGIN_PATH);
    }
  }, [router]);

  return { me, mounted, signOut, refreshSession, setMe };
}

export default useAuth;
