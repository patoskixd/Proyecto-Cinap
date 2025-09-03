// src/presentation/hooks/useAuth.ts
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { Me } from "@/domain/auth";
import { AuthRepoHttp } from "@infrastructure/auth/AuthRepoHttp";
import { makeGetMe } from "@/application/auth/usecases/GetMe";
import { makeSignOut } from "@/application/auth/usecases/SignOut";
import { makeReissue } from "@/application/auth/usecases/Reissue";

const repo = new AuthRepoHttp();
const getMeUC = makeGetMe(repo);
const signOutUC = makeSignOut(repo);
const reissueUC = makeReissue(repo);

const LOGIN_PATH = "/auth/login";
const PUBLIC_EXACT = new Set<string>(["/", "/auth/login", "/auth/google/callback"]);
const PUBLIC_PREFIXES = ["/auth", "/public"];
const isPublicRoute = (p: string | null) =>
  !p || PUBLIC_EXACT.has(p) || PUBLIC_PREFIXES.some((x) => p.startsWith(x));

export function useAuth() {
  const router = useRouter();
  const pathname = usePathname();

  const [me, setMe] = useState<Me>({ authenticated: false });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const data = await getMeUC();
      if (!alive) return;

      setMe(data);
      setMounted(true);

      if (data.authenticated === false && !isPublicRoute(pathname)) {
        const next = pathname || "/";
        router.replace(`${LOGIN_PATH}?next=${encodeURIComponent(next)}`);
      }
    })();
    return () => {
      alive = false;
    };
  }, [pathname, router]);

  const signOut = useCallback(async () => {
    try {
      await signOutUC();
    } finally {
      setMe({ authenticated: false });
      router.replace("/"); // o LOGIN_PATH
      router.refresh();
    }
  }, [router]);

  const refreshSession = useCallback(async () => {
    try {
      await reissueUC();
      const data = await getMeUC();
      setMe(data);
      router.refresh();
    } catch {
      setMe({ authenticated: false });
      router.replace(LOGIN_PATH);
    }
  }, [router]);

  return { me, mounted, signOut, refreshSession, setMe };
}

export default useAuth;
