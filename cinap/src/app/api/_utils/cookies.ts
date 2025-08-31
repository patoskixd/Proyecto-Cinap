import { NextResponse } from "next/server";

/** Quita `Domain=...` para que el cookie sea host-only (válido para el dominio del front). */
export function sanitizeSetCookie(raw: string) {
  return raw.replace(/;\s*Domain=[^;]+/gi, "");
}

/** Reenvía todos los Set-Cookie del upstream al NextResponse, sanitizados. */
export function forwardSetCookies(upstream: Response, resp: NextResponse) {
  // En runtimes modernos existe getSetCookie(); si no, cae a un único header.
  const anyHeaders = upstream.headers as any;
  const setCookies: string[] =
    typeof anyHeaders.getSetCookie === "function"
      ? anyHeaders.getSetCookie()
      : (upstream.headers.get("set-cookie") ? [upstream.headers.get("set-cookie") as string] : []);

  for (const c of setCookies) {
    resp.headers.append("set-cookie", sanitizeSetCookie(c));
  }
}
