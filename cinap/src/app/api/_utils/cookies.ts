import { NextResponse } from "next/server";
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";


export function sanitizeSetCookie(raw: string) {
  return raw.replace(/;\s*Domain=[^;]+/gi, "");
}

export function forwardSetCookies(upstream: Response, resp: NextResponse) {
  const anyHeaders = upstream.headers as any;
  const rawList: string[] =
    typeof anyHeaders.getSetCookie === "function"
      ? anyHeaders.getSetCookie()
      : (upstream.headers.get("set-cookie")
          ? [upstream.headers.get("set-cookie") as string]
          : []);
  for (const c of rawList) {
    resp.headers.append("set-cookie", sanitizeSetCookie(c));
  }
}

export function getAccessTokenFromCookies(cookies: ReadonlyRequestCookies) {
  const byAccess = cookies.get("access_token")?.value;
  const byToken = cookies.get("token")?.value;
  const byAuth = cookies.get("Authorization")?.value?.replace(/^Bearer\s+/i, "");
  return byAccess || byToken || byAuth || null;
}
