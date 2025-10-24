import { NextRequest, NextResponse } from "next/server";

type Role = "admin" | "advisor" | "teacher";

type JwtClaims = {
  sub?: string;
  email?: string;
  name?: string;
  role?: string;
  exp?: number;
  iss?: string;
};

const LOGIN_PATH = "/auth/login";
const ROOT_PATH = "/";
const DASHBOARD_PATH = "/dashboard";

const PUBLIC_EXACT_PATHS = new Set<string>([
  ROOT_PATH,
  LOGIN_PATH,
  "/api/auth/google/callback",
  "/api/auth/google/login",
  "/api/auth/login",
  "/api/auth/me",
]);

const PUBLIC_PREFIXES = [
  "/_next",
  "/static",
  "/public",
  "/favicon.ico",
  "/assets",
  "/robots.txt",
  "/sitemap.xml",
  "/manifest.json",
];

const PROTECTED_PAGE_PREFIXES = ["/dashboard", "/admin", "/asesor", "/profesor", "/profile"];

const PROTECTED_API_EXACT = new Set<string>(["/api/auth/logout", "/api/auth/reissue"]);
const PROTECTED_API_PREFIXES = [
  "/api/admin",
  "/api/advisor",
  "/api/teacher",
  "/api/asesorias",
  "/api/dashboard",
  "/api/profile",
  "/api/assistant",
  "/api/telegram",
];

const ROLE_POLICIES: Array<{ pattern: RegExp; allow: Role[] }> = [
  { pattern: /^\/admin(?:\/|$)/i, allow: ["admin"] },
  { pattern: /^\/api\/admin(?:\/|$)/i, allow: ["admin"] },
  { pattern: /^\/asesor(?:\/|$)/i, allow: ["advisor"] },
  { pattern: /^\/api\/advisor(?:\/|$)/i, allow: ["advisor", "teacher", "admin"] },
  { pattern: /^\/profesor(?:\/|$)/i, allow: ["teacher"] },
  { pattern: /^\/api\/teacher(?:\/|$)/i, allow: ["teacher"] },
  { pattern: /^\/api\/asesorias(?:\/|$)/i, allow: ["teacher", "advisor", "admin"] },
];

const DEFAULT_HOME_BY_ROLE: Record<Role, string> = {
  admin: DASHBOARD_PATH,
  advisor: DASHBOARD_PATH,
  teacher: DASHBOARD_PATH,
};

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
  Pragma: "no-cache",
  Vary: "Cookie",
};

export async function middleware(req: NextRequest) {
  const { pathname: rawPathname } = req.nextUrl;
  const pathname = normalizePath(rawPathname);
  const method = req.method.toUpperCase();

  if (method === "OPTIONS" || isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  const isApiRoute = pathname.startsWith("/api/");
  const token = req.cookies.get("app_session")?.value ?? null;

  if (isPublicRoute(pathname)) {
    if (token && (pathname === ROOT_PATH || isAuthRoute(pathname))) {
      const session = await verifyJwt(token);
      if (session) {
        const role = mapRole(session.role);
        const redirectUrl = req.nextUrl.clone();
        redirectUrl.pathname = getHomePath(role);
        if (pathname === LOGIN_PATH) {
          redirectUrl.search = "";
        }
        return NextResponse.redirect(redirectUrl);
      }
    }
    return NextResponse.next();
  }

  const requiresAuth =
    isProtectedRoute(pathname, isApiRoute) || ROLE_POLICIES.some(({ pattern }) => pattern.test(pathname));

  if (!requiresAuth) {
    return NextResponse.next();
  }

  if (!token) {
    return handleUnauthenticated(req, isApiRoute);
  }

  const session = await verifyJwt(token);
  if (!session) {
    return handleUnauthenticated(req, isApiRoute);
  }

  const role = mapRole(session.role);

  if (isAuthRoute(pathname)) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = getHomePath(role);
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  const matchedRoleRule = ROLE_POLICIES.find(({ pattern }) => pattern.test(pathname));
  if (matchedRoleRule && (!role || !matchedRoleRule.allow.includes(role))) {
    console.warn("[middleware] role blocked", {
      path: pathname,
      role,
      allow: matchedRoleRule.allow,
    });
    return handleForbidden(req, isApiRoute);
  }

  const headers = new Headers(req.headers);
  if (session.sub) headers.set("x-auth-user-id", String(session.sub));
  if (session.email) headers.set("x-auth-user-email", String(session.email));
  if (session.name) headers.set("x-auth-user-name", String(session.name));
  if (role) headers.set("x-auth-user-role", role);
  headers.set("x-auth-token-valid", "1");

  return NextResponse.next({
    request: { headers },
  });
}

function isStaticAsset(pathname: string) {
  return /\.[^/]+$/.test(pathname);
}

function normalizePath(path: string) {
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
  return path;
}

function isPublicRoute(pathname: string) {
  if (PUBLIC_EXACT_PATHS.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isAuthRoute(pathname: string) {
  return pathname === LOGIN_PATH || pathname.startsWith("/auth/");
}

function isProtectedRoute(pathname: string, isApiRoute: boolean) {
  if (isApiRoute) {
    if (PROTECTED_API_EXACT.has(pathname)) return true;
    return PROTECTED_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  }
  return PROTECTED_PAGE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function getHomePath(role: Role | null) {
  if (role && DEFAULT_HOME_BY_ROLE[role]) return DEFAULT_HOME_BY_ROLE[role];
  return DASHBOARD_PATH;
}

function mapRole(value: unknown): Role | null {
  if (!value) return null;
  const normalized = String(value).trim().toLowerCase();
  if (["admin", "administrador", "administradora"].includes(normalized)) return "admin";
  if (["advisor", "asesor", "asesora"].includes(normalized)) return "advisor";
  if (["teacher", "docente", "profesor", "profesora"].includes(normalized)) return "teacher";
  return null;
}

function handleUnauthenticated(req: NextRequest, isApiRoute: boolean) {
  if (isApiRoute) {
    const resp = NextResponse.json({ detail: "Sesion requerida" }, { status: 401, headers: NO_STORE_HEADERS });
    resp.cookies.delete("app_session");
    return resp;
  }
  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = LOGIN_PATH;
  loginUrl.searchParams.set("next", req.nextUrl.pathname + req.nextUrl.search);
  const resp = NextResponse.redirect(loginUrl);
  resp.cookies.delete("app_session");
  return resp;
}

function handleForbidden(req: NextRequest, isApiRoute: boolean) {
  if (isApiRoute) {
    return NextResponse.json({ detail: "Permisos insuficientes" }, { status: 403, headers: NO_STORE_HEADERS });
  }
  const redirectUrl = req.nextUrl.clone();
  redirectUrl.pathname = DASHBOARD_PATH;
  redirectUrl.search = "";
  redirectUrl.searchParams.set("forbidden", "1");
  return NextResponse.redirect(redirectUrl);
}

async function verifyJwt(token: string): Promise<JwtClaims | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;

    const headerJson = decodeBase64Url(headerB64);
    const payloadJson = decodeBase64Url(payloadB64);
    if (!headerJson || !payloadJson) return null;

    const header = JSON.parse(headerJson);
    if (!header || header.alg?.toUpperCase() !== "HS256") return null;

    let claims: JwtClaims;
    try {
      claims = JSON.parse(payloadJson) as JwtClaims;
    } catch {
      return null;
    }

    if (claims.exp && claims.exp * 1000 < Date.now()) return null;

    const expectedIssuer = process.env.JWT_ISSUER;
    if (expectedIssuer && claims.iss && claims.iss !== expectedIssuer) return null;

    const secret =
      process.env.JWT_SECRET || process.env.APP_JWT_SECRET || process.env.NEXT_PUBLIC_JWT_SECRET || "";
    if (!secret) {
      console.warn("[middleware] JWT_SECRET is not configured; signature verification skipped.");
      return claims;
    }

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );

    const data = encoder.encode(`${headerB64}.${payloadB64}`);
    const expectedSignature = new Uint8Array(await crypto.subtle.sign("HMAC", key, data));
    const providedSignature = base64UrlToUint8Array(signatureB64);

    if (!timingSafeEqual(expectedSignature, providedSignature)) return null;

    return claims;
  } catch (err) {
    console.error("[middleware] Failed to verify JWT:", err);
    return null;
  }
}

function base64UrlToUint8Array(input: string): Uint8Array {
  const base64 = toBase64(input);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function decodeBase64Url(input: string): string | null {
  try {
    const bytes = base64UrlToUint8Array(input);
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

function toBase64(input: string) {
  const padding = "=".repeat((4 - (input.length % 4)) % 4);
  return (input + padding).replace(/-/g, "+").replace(/_/g, "/");
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.json).*)"],
};
