// middleware.ts
import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = [
  "/auth/login",
  "/auth/callback", // si la usas en el front
  "/_next", "/favicon.ico", "/robots.txt", "/sitemap.xml",
  "/api/public" // si tienes APIs públicas
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // permitir rutas públicas
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // exigir cookie jwt en el resto
  const token = req.cookies.get("app_session")?.value;
  if (!token) {
    const url = new URL("/auth/login", req.url);
    url.searchParams.set("next", pathname); // para volver después de login
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // protege todo salvo archivos estáticos
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"],
};
