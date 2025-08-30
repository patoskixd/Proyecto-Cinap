// src/application/auth/usecases/getMe.ts
export type UserDTO = {
  id: string;
  email: string;
  name: string;
  role: string;
};

export type Me =
  | { authenticated: false }
  | { authenticated: true; user: UserDTO };

export async function getMe(): Promise<Me> {
  try {
    const res = await fetch("/api/auth/me", {
      method: "GET",
      // IMPORTANTE: enviar cookies del navegador
      credentials: "include",
      cache: "no-store",
    });

    // si el proxy respondió algo no-OK, tratamos como no autenticado
    if (!res.ok) return { authenticated: false };

    const data = (await res.json()) as Me;
    // normaliza por si backend devuelve algo inesperado
    if (!data || typeof data !== "object") return { authenticated: false };
    if ("authenticated" in data && data.authenticated === true && (data as any).user) {
      return data as { authenticated: true; user: UserDTO };
    }
    return { authenticated: false };
  } catch {
    return { authenticated: false };
  }
}
