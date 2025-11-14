import { NextRequest, NextResponse } from "next/server";
import { AuthBackendRepo } from "@infrastructure/http/bff/auth/AuthBackendRepo";
import { appendSetCookies } from "@/app/api/_utils/cookies";

function getCookieString(req: NextRequest): string {
  return req.headers.get("cookie") ?? "";
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const repo = new AuthBackendRepo(getCookieString(req));
    const { redirectUrl, status } = await repo.startGoogleLogin();
    const statusCode = status >= 300 && status < 400 ? status : 302;
    const resp = NextResponse.redirect(redirectUrl, { status: statusCode });
    appendSetCookies(repo.getSetCookies(), resp);
    return resp;
  } catch (err: any) {
    const message = err?.message || "No se pudo iniciar sesión con Google";
    return NextResponse.json(
      { detail: message },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }
}
