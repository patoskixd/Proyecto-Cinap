import { NextResponse } from "next/server";
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

export function sanitizeSetCookie(raw: string) {
  return raw.replace(/;\s*Domain=[^;]+/gi, "");
}

type ParsedCookie = {
  name: string;
  attrs: Record<string, string | true>;
};

function parseSetCookie(raw: string): ParsedCookie | null {
  const parts = raw.split(";").map((p) => p.trim()).filter(Boolean);
  if (!parts.length) return null;
  const [nameValue, ...rest] = parts;
  const [name] = nameValue.split("=");
  if (!name) return null;
  const attrs: Record<string, string | true> = {};
  for (const attr of rest) {
    const [k, v] = attr.split("=");
    if (!k) continue;
    const key = k.trim().toLowerCase();
    const val = v === undefined ? true : v.trim();
    attrs[key] = val;
  }
  return { name: name.trim(), attrs };
}

function ensureSecureSessionCookies(rawList: string[]) {
  const sanitized: string[] = [];
  const errors: string[] = [];

  for (const raw of rawList) {
    const parsed = parseSetCookie(raw);
    if (!parsed) continue;

    if (parsed.name.toLowerCase() === "app_session") {
      const attrs = parsed.attrs;
      const hasHttpOnly = "httponly" in attrs;
      const hasSecure = "secure" in attrs;
      const sameSite = typeof attrs.samesite === "string" ? attrs.samesite.toLowerCase() : "";
      const path = typeof attrs.path === "string" ? attrs.path : "";
      const hasLifetime = "max-age" in attrs || "expires" in attrs;
      const sameSiteOk = sameSite === "strict" || sameSite === "lax";
      const pathOk = path === "/";

      if (!hasHttpOnly || !hasSecure || !sameSiteOk || !pathOk || !hasLifetime) {
        errors.push("app_session cookie missing required security attributes");
        continue;
      }
    }

    sanitized.push(sanitizeSetCookie(raw));
  }

  if (errors.length) throw new Error(errors.join("; "));
  return sanitized;
}

export function forwardSetCookies(upstream: Response, resp: NextResponse) {
  const anyHeaders = upstream.headers as any;
  const rawList: string[] =
    typeof anyHeaders.getSetCookie === "function"
      ? anyHeaders.getSetCookie()
      : (upstream.headers.get("set-cookie")
          ? [upstream.headers.get("set-cookie") as string]
          : []);
  const sanitized = ensureSecureSessionCookies(rawList);
  for (const c of sanitized) resp.headers.append("set-cookie", c);
}

export function appendSetCookies(rawList: string[], resp: NextResponse) {
  const sanitized = ensureSecureSessionCookies(rawList);
  for (const c of sanitized) resp.headers.append("set-cookie", c);
}

export function getAccessTokenFromCookies(cookies: ReadonlyRequestCookies) {
  const byAccess = cookies.get("access_token")?.value;
  const byToken = cookies.get("token")?.value;
  const byAuth = cookies.get("Authorization")?.value?.replace(/^Bearer\s+/i, "");
  return byAccess || byToken || byAuth || null;
}
